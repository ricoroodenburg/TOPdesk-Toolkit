import { testConnection } from './functions/topdeskClient.js';
import { state } from './components/state.js';
import { saveSettings } from './components/storage.js';

// Defaults in state
state.topdesk ||= {};
state.topdesk.authentication ||= {};
const auth = state.topdesk.authentication;

// -----------------------------
// HTML TEMPLATE (met al jouw inline styles!)
// -----------------------------
export const topdeskPopupHTML = (auth = {}) => `
    <div class="mb-3">
      <label class="label">TOPdesk URL (required)</label>
      <div class="validation-feedback__message" id="error-url"></div>
      <input id="td-url" class="textbox" value="${auth.url || ''}" placeholder="https://customer.topdesk.net" required>
    </div>
    <div class="mb-3">
      <label class="label">Username (required)</label>
      <div class="validation-feedback__message" id="error-username"></div>
      <input id="td-username" class="textbox" value="${auth.username || ''}" placeholder="Username" required>
    </div>
    <div class="mb-3">
      <label class="label">Application Password (required)</label>
      <div class="validation-feedback__message" id="error-password"></div>
      <input id="td-password" class="textbox" placeholder="Application Password" required type="password">
    </div>
    <button class="button secondary" id="td-login-btn">Connect</button>
    <br>
    <div id="td-login-status" class="mt-3"></div>
`;

// -----------------------------
// LOGICA VOOR CONNECT KNOP
export function setupTopdeskPopup() {
  const tdLoginBtn = document.querySelector(".popup-action-btn");
  if (!tdLoginBtn) return;

  tdLoginBtn.addEventListener("click", async () => {
    const url = document.querySelector("#td-url").value;
    const username = document.querySelector("#td-username").value;
    const password = document.querySelector("#td-password").value;

    // Validatie
    let hasError = false;
    if (!url) { document.getElementById("error-url").textContent = "URL is required"; hasError = true; }
    if (!username) { document.getElementById("error-username").textContent = "Username is required"; hasError = true; }
    if (!password) { document.getElementById("error-password").textContent = "Password is required"; hasError = true; }
    if (hasError) return;

    const statusEl = document.getElementById("td-login-status");
    statusEl.textContent = "Connecting...";

    try {
      await testConnection({ url, username, password });

      state.topdesk.authentication = { url, username, password };
      saveSettings();

      statusEl.textContent = "Connected successfully!";
    } catch (err) {
      statusEl.textContent = `Connection failed: ${err.message}`;
    }
  });
}
