import { msalConfig, loginRequest } from "./msalConfig.js";

const msalInstance = new msal.PublicClientApplication(msalConfig);

export async function loginGraph() {
    const result = await msalInstance.loginPopup(loginRequest);
    return result;
}
