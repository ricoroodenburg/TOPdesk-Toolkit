import { testConnection } from '../functions/topdeskClient.js';
import { state } from '../components/state.js';
import { saveSettings } from '../components/storage.js';

export const step2 = {
    title: t('terms.connectionSettings'),
    render: (container, data, wizardState, updateButtons) => {

        // --- Defaults in state ---
        state.topdesk ||= {};
        state.topdesk.authentication ||= {};
        const auth = state.topdesk.authentication;

        // --- HTML render met error divs boven input ---
        container.innerHTML = `
        <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
            <div style="text-align: center;">
                <h1 data-i18n="terms.connectToTopdesk"></h1>
                <p data-i18n="terms.connectToTopdeskDescription">Enter your TOPdesk URL, username and application password to connect to your environment.</p>
            </div>
            <div style="margin: 0 auto">
                <div class="mb-3">
                    <label class="label">${t('labels.topdeskUrl')} (${t('terms.required')})</label>
                    <div class="validation-feedback__message" id="error-url"></div>
                    <input id="td-url" class="textbox" value="${auth.url || ''}" placeholder="https://customer.topdesk.net" required>
                </div>
                <div class="mb-3">
                    <label class="label">${t('labels.username')} (${t('terms.required')})</label>
                    <div class="validation-feedback__message" id="error-username"></div>
                    <input id="td-username" class="textbox" value="${auth.username || ''}" placeholder="${t('labels.username')} " required>
                </div>
                <div class="mb-3">
                    <label class="label">${t('labels.applicationPassword')} (${t('terms.required')})</label>
                    <div class="validation-feedback__message" id="error-password"></div>
                    <input id="td-password" class="textbox" placeholder="${t('labels.applicationPassword')} " required type="password">
                </div>
                <button class="button secondary" id="td-login-btn">${t('buttons.connect')} </button>
                <br>
                <div id="td-login-status" class="mt-3"></div>
            </div>
        </div>
        `;
        
        setLanguage(window.currentLang);

        const urlInput = container.querySelector('#td-url');
        const userInput = container.querySelector('#td-username');
        const passInput = container.querySelector('#td-password');
        const statusDiv = container.querySelector("#td-login-status");
        const loginBtn = container.querySelector("#td-login-btn")
        const errorUrl = container.querySelector('#error-url');
        const errorUsername = container.querySelector('#error-username');
        const errorPassword = container.querySelector('#error-password');

        // --- Validatie functie ---
        const validateStep2 = () => {
            // Clear previous errors
            [urlInput, userInput, passInput].forEach(f => f.classList.remove("error"));
            errorUrl.textContent = "";
            errorUsername.textContent = "";
            errorPassword.textContent = "";

            let valid = true;

            if (!urlInput.value.trim()) {
                urlInput.classList.add("error");
                errorUrl.textContent = `${t('labels.url')} ${t('messages.canNotBeEmpty').toLowerCase()}`;
                valid = false;
            }
            if (!userInput.value.trim()) {
                userInput.classList.add("error");
                errorUsername.textContent = `${t('labels.username')} ${t('messages.canNotBeEmpty').toLowerCase()}`;
                valid = false;
            }
            if (!passInput.value.trim()) {
                passInput.classList.add("error");
                errorPassword.textContent = `${t('labels.applicationPassword')} ${t('messages.canNotBeEmpty').toLowerCase()}`;
                valid = false;
            }

            return valid;
        };

        // --- Input event listeners: foutmelding weg zodra gebruiker typt ---
        [urlInput, userInput, passInput].forEach((input, idx) => {
            input.addEventListener('input', () => {
                input.classList.remove("error");
                if (idx === 0) errorUrl.textContent = "";
                if (idx === 1) errorUsername.textContent = "";
                if (idx === 2) errorPassword.textContent = "";
                loginBtn.textContent = t('buttons.connect');
                loginBtn.disabled = false;
                statusDiv.innerHTML = "";
            });
        });

        // --- Event listener voor verbinding testen ---
        container.querySelector('#td-login-btn').addEventListener('click', async () => {

            // 1️⃣ Veldvalidatie
            if (!validateStep2()) {
                wizardState.stepsValid[1] = false;
                updateButtons();
                return;
            }

            const url = urlInput.value.trim();
            const username = userInput.value.trim();
            const password = passInput.value.trim();

            // 2️⃣ Verbinding testen
            statusDiv.innerHTML = `
                <div style="margin-top: 1rem">
                    <div class="notification-info">
                        <strong class="notification-title">${t('terms.tryingConnect')}</strong>
                        <p class="notification-description">${t('terms.tryingConnectWith')} TOPdesk...</p>
                    </div>
                </div>
            `;

            loginBtn.textContent = `${t('terms.tryingConnect')}...`
            loginBtn.disabled = true;

            try {
                const version = await testConnection(url, username, password);

                // Update state + localStorage
                state.topdesk.authentication = { url, username, password, version };
                saveSettings({ topdesk: { authentication: { url, username } } });

                // Success message
                statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-success">
                            <strong>${t('terms.success')}</strong>
                            <p>${t('messages.credentialsValidTopdesk')}. TOPdesk ${t('terms.version').toLowerCase()}: ${version}</p>
                        </div>
                    </div>
                `;
                loginBtn.textContent = t('buttons.connect');
                loginBtn.disabled = false;
                wizardState.stepsValid[1] = true;
                updateButtons();

            } catch (err) {
                console.error(err);
                statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-error">
                            <strong>${t('terms.error')}</strong>
                            <p>${err}</p>
                        </div>
                    </div>
                `;

                loginBtn.textContent = t('buttons.connect');
                loginBtn.disabled = false;
                wizardState.stepsValid[1] = false;
                updateButtons();
            }
        });
    }
};
