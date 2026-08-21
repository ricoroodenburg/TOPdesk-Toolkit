import { testConnection } from '../functions/topdeskClient.js';
import { state } from '../components/state.js';
import { saveSettings } from '../components/storage.js';
import { signInWithTopdesk } from '../functions/topdeskOAuth.js';

export const step2 = {
    render: (container, data, wizardState, updateButtons) => {

        // --- Defaults in state ---
        state.topdesk ||= {};
        state.topdesk.authentication ||= {};
        const auth = state.topdesk.authentication;

        // Default authentication method
        let authenticationMethod = 'oauth';

        // --- HTML ---
        container.innerHTML = `
        <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
            <div style="text-align: center;">
                <h1 data-i18n="terms.connectToTopdesk"></h1>
                <p data-i18n="terms.connectToTopdeskDescription">
                    Enter your TOPdesk URL and username to connect to your environment.
                </p>
            </div>

            <div style="margin: 0 auto">

                <div class="mb-3">
                    <label class="label">
                        ${t('labels.topdeskUrl')} (${t('terms.required')})
                    </label>
                    <div class="validation-feedback__message" id="error-url"></div>
                    <input
                        id="td-url"
                        class="textbox"
                        value="${auth.url || ''}"
                        placeholder="https://customer.topdesk.net"
                        required
                    >
                </div>

                <div class="mb-3">
                    <label class="label">
                        ${t('labels.username')} / ${t('labels.clientId')} (${t('terms.required')})
                    </label>
                    <div class="validation-feedback__message" id="error-username"></div>
                    <input
                        id="td-username"
                        class="textbox"
                        value="${auth.username || ''}"
                        placeholder="${t('labels.username')}"
                        required
                    >
                </div>

                <!-- Application password authentication -->
                <div id="application-password-section" style="display: none;">
                    <div class="mb-3">
                        <label class="label">
                            ${t('labels.applicationPassword')} (${t('terms.required')})
                        </label>
                        <div class="validation-feedback__message" id="error-password"></div>
                        <input
                            id="td-password"
                            class="textbox"
                            placeholder="${t('labels.applicationPassword')}"
                            required
                            type="password"
                        >
                    </div>
                </div>

                <button class="button secondary" id="td-login-btn">
                    ${t('buttons.signInWithTopdesk')}
                </button>

                <div style="margin-top: 1rem; text-align: center;">
                    <a href="#" id="toggle-auth-method">
                        ${t('buttons.signInWithApplicationPassword')}
                    </a>
                </div>

                <div id="td-login-status" class="mt-3"></div>

            </div>
        </div>
        `;

        setLanguage(window.currentLang);

        // --- Elements ---
        const urlInput = container.querySelector('#td-url');
        const userInput = container.querySelector('#td-username');
        const passInput = container.querySelector('#td-password');

        const statusDiv = container.querySelector("#td-login-status");
        const loginBtn = container.querySelector("#td-login-btn");

        const toggleAuthMethod = container.querySelector('#toggle-auth-method');
        const applicationPasswordSection = container.querySelector('#application-password-section');

        const errorUrl = container.querySelector('#error-url');
        const errorUsername = container.querySelector('#error-username');
        const errorPassword = container.querySelector('#error-password');


        // ============================================================
        // OAuth callback
        // ============================================================

        const handleTopdeskOAuthMessage = (event) => {

            // Alleen berichten van onze eigen site accepteren
            if (event.origin !== window.location.origin) {
                return;
            }

            // Alleen TOPdesk OAuth berichten accepteren
            if (event.data?.type !== 'TOPDESK_OAUTH_RESULT') {
                return;
            }

            // Alleen verwerken als OAuth nog steeds de gekozen methode is
            if (authenticationMethod !== 'oauth') {
                return;
            }

            const {
                code,
                state: returnedState,
                error,
                errorDescription
            } = event.data;

            const expectedState =
                sessionStorage.getItem('topdesk_oauth_state');


            // --- State controleren ---
            if (
                !returnedState ||
                returnedState !== expectedState
            ) {
                statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-error">
                            <strong>${t('terms.error')}</strong>
                            <p>Invalid OAuth state.</p>
                        </div>
                    </div>
                `;

                loginBtn.disabled = false;
                loginBtn.textContent =
                    t('buttons.signInWithTopdesk');

                return;
            }


            // --- TOPdesk heeft een OAuth error teruggegeven ---
            if (error) {
                statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-error">
                            <strong>${t('terms.error')}</strong>
                            <p>${errorDescription || error}</p>
                        </div>
                    </div>
                `;

                loginBtn.disabled = false;
                loginBtn.textContent =
                    t('buttons.signInWithTopdesk');

                return;
            }


            // --- Geen authorization code ontvangen ---
            if (!code) {
                statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-error">
                            <strong>${t('terms.error')}</strong>
                            <p>No authorization code received.</p>
                        </div>
                    </div>
                `;

                loginBtn.disabled = false;
                loginBtn.textContent =
                    t('buttons.signInWithTopdesk');

                return;
            }


            // ========================================================
            // SUCCESS
            // ========================================================

            statusDiv.innerHTML = `
                <div style="margin-top: 1rem">
                    <div class="notification-success">
                        <strong>${t('terms.success')}</strong>

                        <p>
                            TOPdesk OAuth authorization successful.
                        </p>

                        <p>
                            Authorization code:
                        </p>

                        <div style="
                            padding: 0.75rem;
                            background: #f5f5f5;
                            border-radius: 4px;
                            word-break: break-all;
                        ">
                            <code>${code}</code>
                        </div>
                    </div>
                </div>
            `;

            // Voor deze test slaan we de authorization code
            // tijdelijk op in de state.
            state.topdesk.authentication = {
                url: urlInput.value.trim(),
                username: userInput.value.trim(),
                method: 'oauth',
                code
            };

            loginBtn.textContent = t('terms.success');
            loginBtn.disabled = false;

            // Stap succesvol afgerond
            wizardState.stepsValid[1] = true;
            updateButtons();

            console.log(
                'TOPdesk authorization code received:',
                code
            );

            // State is eenmalig gebruikt
            sessionStorage.removeItem('topdesk_oauth_state');
        };

        // Luister naar het OAuth popup-window
        window.addEventListener(
            'message',
            handleTopdeskOAuthMessage
        );


        // --- Switch authentication method ---
        toggleAuthMethod.addEventListener('click', (event) => {
            event.preventDefault();

            if (authenticationMethod === 'oauth') {
                // Switch to application password
                authenticationMethod = 'application-password';

                applicationPasswordSection.style.display = 'block';

                loginBtn.textContent = t('buttons.connect');

                toggleAuthMethod.textContent =
                    t('buttons.signInWithTopdesk');

            } else {
                // Switch back to OAuth
                authenticationMethod = 'oauth';

                applicationPasswordSection.style.display = 'none';

                loginBtn.textContent =
                    t('buttons.signInWithTopdesk');

                toggleAuthMethod.textContent =
                    t('buttons.signInWithApplicationPassword');
            }

            // Clear status/errors
            statusDiv.innerHTML = "";
            [urlInput, userInput, passInput].forEach(f =>
                f.classList.remove("error")
            );

            errorUrl.textContent = "";
            errorUsername.textContent = "";
            errorPassword.textContent = "";
        });

        // --- Validation ---
        const validateStep2 = () => {

            [urlInput, userInput, passInput].forEach(f =>
                f.classList.remove("error")
            );

            errorUrl.textContent = "";
            errorUsername.textContent = "";
            errorPassword.textContent = "";

            let valid = true;

            if (!urlInput.value.trim()) {
                urlInput.classList.add("error");
                errorUrl.textContent =
                    `${t('labels.topdeskUrl')} ${t('messages.canNotBeEmpty').toLowerCase()}`;
                valid = false;
            }

            if (!userInput.value.trim()) {
                userInput.classList.add("error");
                errorUsername.textContent =
                    `${t('labels.username')} ${t('messages.canNotBeEmpty').toLowerCase()}`;
                valid = false;
            }

            if (
                authenticationMethod === 'application-password' &&
                !passInput.value.trim()
            ) {
                passInput.classList.add("error");
                errorPassword.textContent =
                    `${t('labels.applicationPassword')} ${t('messages.canNotBeEmpty').toLowerCase()}`;
                valid = false;
            }

            return valid;
        };

        // --- Input listeners ---
        [urlInput, userInput, passInput].forEach((input, idx) => {

            input.addEventListener('input', () => {

                input.classList.remove("error");

                if (idx === 0) errorUrl.textContent = "";
                if (idx === 1) errorUsername.textContent = "";
                if (idx === 2) errorPassword.textContent = "";

                statusDiv.innerHTML = "";

                loginBtn.disabled = false;
            });
        });

        // --- Login ---
        loginBtn.addEventListener('click', async () => {

            if (!validateStep2()) {
                wizardState.stepsValid[1] = false;
                updateButtons();
                return;
            }

            const url = urlInput.value.trim();
            const username = userInput.value.trim();

            // ============================================================
            // OAuth
            // ============================================================
            if (authenticationMethod === 'oauth') {
                try {
                    loginBtn.disabled = true;
                    loginBtn.textContent = `${t('terms.tryingConnect')}...`;

                    signInWithTopdesk(url, username);

                } catch (err) {
                    console.error(err);

                    statusDiv.innerHTML = `
                        <div style="margin-top: 1rem">
                            <div class="notification-error">
                                <strong>${t('terms.error')}</strong>
                                <p>${err.message || err}</p>
                            </div>
                        </div>
                    `;

                    loginBtn.disabled = false;
                    loginBtn.textContent =
                        t('buttons.signInWithTopdesk');
                }

                return;
            }

            // ============================================================
            // Application password
            // ============================================================

            const password = passInput.value.trim();

            statusDiv.innerHTML = `
                <div style="margin-top: 1rem">
                    <div class="notification-info">
                        <strong class="notification-title">
                            ${t('terms.tryingConnect')}
                        </strong>
                        <p class="notification-description">
                            ${t('terms.tryingConnectWith')} TOPdesk...
                        </p>
                    </div>
                </div>
            `;

            loginBtn.textContent = `${t('terms.tryingConnect')}...`;
            loginBtn.disabled = true;

            try {

                const version = await testConnection(
                    url,
                    username,
                    password
                );

                state.topdesk.authentication = {
                    url,
                    username,
                    password,
                    version,
                    method: 'application-password'
                };

                saveSettings({
                    topdesk: {
                        authentication: {
                            url,
                            username
                        }
                    }
                });

                statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-success">
                            <strong>${t('terms.success')}</strong>
                            <p>
                                ${t('messages.credentialsValidTopdesk')}.
                                TOPdesk ${t('terms.version').toLowerCase()}: ${version}
                            </p>
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