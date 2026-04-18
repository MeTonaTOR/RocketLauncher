export const URLS = {
  API_MAIN: "https://api.worldunited.gg",
  MODNET_CDN: "https://cdn.soapboxrace.world",

  cdnList: (apiBase: string) => `${apiBase}/cdn_list.json`,
  serverInfo: (serverIp: string) => `${serverIp}/GetServerInformation`,
  authLogin: (serverIp: string) => `${serverIp}/User/authenticateUser`,
  authRegister: (serverIp: string) => `${serverIp}/User/createUser`,
  authModernLogin: (serverIp: string) => `${serverIp}/User/modernAuth`,
  authModernRegister: (serverIp: string) => `${serverIp}/User/modernRegister`,
  recoveryPassword: (serverIp: string) =>
    `${serverIp}/RecoveryPassword/forgotPassword`,
} as const;
