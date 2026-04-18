use std::path::Path;
use windows_sys::Win32::{
    Foundation::{CloseHandle, FALSE, HANDLE},
    System::{
        JobObjects::{
            AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
            SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
            JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
        },
        Threading::{
            CreateProcessW, DeleteProcThreadAttributeList, GetExitCodeProcess,
            InitializeProcThreadAttributeList,
            ResumeThread, UpdateProcThreadAttribute, WaitForSingleObject, PROCESS_INFORMATION,
            STARTUPINFOEXW,
        },
    },
};

const CREATE_SUSPENDED: u32 = 0x0000_0004;
const EXTENDED_STARTUPINFO_PRESENT: u32 = 0x0008_0000;
const INFINITE: u32 = 0xFFFF_FFFF;

const PROC_THREAD_ATTRIBUTE_MITIGATION_POLICY: usize = 0x0002_0007;

const MITIGATION_POLICY: u64 = 0x01 | 0x04;

pub struct GuardedChild {
    process: HANDLE,
    thread: HANDLE,
    job: HANDLE,
}

unsafe impl Send for GuardedChild {}

impl GuardedChild {
    pub fn wait(&self) -> u32 {
        unsafe {
            WaitForSingleObject(self.process, INFINITE);
            let mut code: u32 = 1;
            GetExitCodeProcess(self.process, &mut code);
            code
        }
    }

    pub fn process_handle(&self) -> HANDLE {
        self.process
    }
}

impl Drop for GuardedChild {
    fn drop(&mut self) {
        unsafe {
            if self.thread != 0 { CloseHandle(self.thread); }
            if self.process != 0 { CloseHandle(self.process); }
            if self.job != 0 { CloseHandle(self.job); }
        }
    }
}

pub fn launch_guarded(exe: &Path, working_dir: &Path, args: &[&str]) -> Result<GuardedChild, String> {
    unsafe {
        let cmd = build_cmdline(exe, args);
        let mut cmd_w: Vec<u16> = cmd.encode_utf16().chain(Some(0)).collect();
        let exe_w: Vec<u16> = {
            use std::os::windows::ffi::OsStrExt;
            exe.as_os_str().encode_wide().chain(Some(0)).collect()
        };
        let dir_w: Vec<u16> = {
            use std::os::windows::ffi::OsStrExt;
            working_dir.as_os_str().encode_wide().chain(Some(0)).collect()
        };

        let mut attr_size: usize = 0;
        InitializeProcThreadAttributeList(std::ptr::null_mut(), 1, 0, &mut attr_size);
        let mut attr_buf = vec![0u8; attr_size];
        let attr_list = attr_buf.as_mut_ptr() as *mut std::ffi::c_void;

        let attr_ok = InitializeProcThreadAttributeList(attr_list, 1, 0, &mut attr_size) != FALSE;

        let policy = MITIGATION_POLICY;
        let mitigation_ok = attr_ok && UpdateProcThreadAttribute(
            attr_list,
            0,
            PROC_THREAD_ATTRIBUTE_MITIGATION_POLICY,
            &policy as *const u64 as *const std::ffi::c_void,
            std::mem::size_of::<u64>(),
            std::ptr::null_mut(),
            std::ptr::null(),
        ) != FALSE;

        let mut si = std::mem::zeroed::<STARTUPINFOEXW>();
        si.StartupInfo.cb = std::mem::size_of::<STARTUPINFOEXW>() as u32;
        if mitigation_ok {
            si.lpAttributeList = attr_list;
        }

        let creation_flags = if mitigation_ok {
            CREATE_SUSPENDED | EXTENDED_STARTUPINFO_PRESENT
        } else {
            CREATE_SUSPENDED
        };

        let mut pi = std::mem::zeroed::<PROCESS_INFORMATION>();
        let created = CreateProcessW(
            exe_w.as_ptr(),
            cmd_w.as_mut_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            FALSE,
            creation_flags,
            std::ptr::null(),
            dir_w.as_ptr(),
            &si as *const STARTUPINFOEXW as *const _,
            &mut pi,
        );

        if attr_ok {
            DeleteProcThreadAttributeList(attr_list);
        }

        if created == FALSE {
            return Err(format!("CreateProcessW failed: {}", std::io::Error::last_os_error()));
        }

        let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
        if job != 0 {
            let mut info = std::mem::zeroed::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>();
            info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
            SetInformationJobObject(
                job,
                JobObjectExtendedLimitInformation,
                &info as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
            );
            AssignProcessToJobObject(job, pi.hProcess);
        }

        ResumeThread(pi.hThread);

        Ok(GuardedChild {
            process: pi.hProcess,
            thread: pi.hThread,
            job,
        })
    }
}

fn build_cmdline(exe: &Path, args: &[&str]) -> String {
    let mut parts = vec![format!("\"{}\"", exe.display())];
    for arg in args {
        if arg.contains(' ') {
            parts.push(format!("\"{}\"", arg));
        } else {
            parts.push((*arg).to_string());
        }
    }
    parts.join(" ")
}
