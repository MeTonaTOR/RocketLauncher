#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process'; // spawnSync used for cargo update
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const tauriDir = join(rootDir, 'src-tauri');

// Get arguments passed to the script
const args = process.argv.slice(2);
const isFinal = args.includes('-final') || args.includes('--final');

// Remove -final from args to pass clean args to tauri
const tauriArgs = args.filter(arg => arg !== '-final' && arg !== '--final');

async function askVersion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter version number (e.g., 1.0.0): ', (version) => {
      rl.close();
      resolve(version.trim());
    });
  });
}

function updateVersion(version) {
  console.log(`\nUpdating version to ${version}...\n`);

  // Update tauri.conf.json
  const tauriConfPath = join(tauriDir, 'tauri.conf.json');
  const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = version;
  writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
  console.log('Updated tauri.conf.json');

  // Update Cargo.toml
  const cargoTomlPath = join(tauriDir, 'Cargo.toml');
  let cargoToml = readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(/^version = "[^"]+"/m, `version = "${version}"`);
  writeFileSync(cargoTomlPath, cargoToml, 'utf8');
  console.log('Updated Cargo.toml');

  // Update package.json
  const packageJsonPath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  console.log('Updated package.json');
  
  // Update Cargo.lock to reflect the new version
  console.log('Updating Cargo.lock...');
  const proc = spawnSync('cargo', ['update', '-p', 'rocket-launcher'], {
    cwd: tauriDir,
    shell: true,
    stdio: 'inherit'
  });
  
  if (proc.status === 0) {
    console.log('Updated Cargo.lock\n');
  } else {
    console.warn('Warning: Could not update Cargo.lock (this may affect version naming)\n');
  }
}

function runBuild(extraArgs = []) {
  return new Promise((resolve, reject) => {
    console.log('Building Tauri app...\n');

    const proc = spawn('npx', ['tauri', 'build', ...extraArgs], {
      cwd: rootDir,
      shell: true,
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed with code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}

function findExeFile(bundleDir, version) {
  const nsisDir = join(bundleDir, 'nsis');
  
  try {
    const stat = statSync(nsisDir);
    if (!stat.isDirectory()) {
      throw new Error('NSIS path is not a directory');
    }
  } catch {
    throw new Error('NSIS directory not found in bundle output');
  }

  const files = readdirSync(nsisDir);
  // Prefer exe matching the current version, fallback to any setup exe
  const exeFile = 
    files.find(f => f.endsWith('.exe') && !f.includes('uninstall') && f.includes(version)) ||
    files.find(f => f.endsWith('.exe') && !f.includes('uninstall'));

  if (!exeFile) {
    throw new Error('Setup .exe file not found in NSIS output');
  }

  return join(nsisDir, exeFile);
}

function createLatestJson(version, exePath) {
  const exeName = basename(exePath);
  const latestJsonPath = join(dirname(exePath), 'latest.json');

  const latestData = {
    version: version,
    exe: exeName,
    publishDate: new Date().toISOString(),
    productName: "RocketLauncher"
  };

  writeFileSync(latestJsonPath, JSON.stringify(latestData, null, 2) + '\n', 'utf8');
  
  console.log('\nCreated latest.json:');
  console.log(JSON.stringify(latestData, null, 2));
  console.log(`\nLocation: ${latestJsonPath}\n`);
}

async function main() {
  try {
    let version = null;

    if (isFinal) {
      console.log('Building FINAL release\n');
      version = await askVersion();
      
      if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
        console.error('Invalid version format. Expected: x.y.z');
        process.exit(1);
      }

      updateVersion(version);
    } else {
      const tauriConfPath = join(tauriDir, 'tauri.conf.json');
      const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));
      version = tauriConf.version;
      console.log(`Building version ${version}...\n`);
    }

    // Run build with remaining args
    await runBuild(tauriArgs);

    if (isFinal) {
      console.log('\nFinalizing release...\n');

      const bundleDir = join(tauriDir, 'target', 'release', 'bundle');
      const installerPath = findExeFile(bundleDir, version);

      createLatestJson(version, installerPath);

      console.log('Final release build complete!\n');
    } else {
      console.log('\nBuild complete!\n');
    }

  } catch (error) {
    console.error('\nBuild failed:', error.message);
    process.exit(1);
  }
}

main();
