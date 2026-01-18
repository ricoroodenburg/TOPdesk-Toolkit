// storage.js
const STORAGE_KEY = "wizardSettings";

function deepMerge(target, source) {
    for (const key in source) {
        if (Array.isArray(source[key])) {
            // Array: overschrijf volledig
            target[key] = source[key].slice();
        } else if (source[key] instanceof Object && key in target) {
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}


export function loadSettings() {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        return json ? JSON.parse(json) : {};
    } catch (e) {
        console.error("Kan settings niet lezen:", e);
        return {};
    }
}

export function saveSettings(settings) {
    try {
        const existing = loadSettings();
        const updated = deepMerge(existing, settings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Kan settings niet opslaan:", e);
    }
}
