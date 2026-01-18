export const msalConfig = {
    auth: {
        clientId: "f2fda4dd-ff4b-45f9-b5fd-74248179925a",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin
    }
};

export const loginRequest = {
    scopes: [
        "User.ReadBasic.All",
        "DeviceManagementManagedDevices.Read.All"
    ]
};
