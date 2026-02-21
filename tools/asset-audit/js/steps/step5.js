// step4.js - Microsoft Intune login + filters (wizard-style)

import { state } from "../components/state.js";
import { saveSettings } from "../components/storage.js";
import { loginGraph } from "../components/graphClient.js";

export const step5 = {
  //title: t('terms.connectToMicrosoftIntune'),

  render: async (container, data, wizardState, updateButtons) => {

    // ------------------------
    // 1. State defaults
    // ------------------------
    state.intune ||= {};
    state.intune.filters ||= {};
    state.intune.filters.ownerType ||= ["Company", "Personal"];

    saveSettings({ intune: state.intune.filters });

    // ------------------------
    // 2. Render UI
    // ------------------------
    const ownerTypes = ["Company", "Personal"];

    container.innerHTML = `
     <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
      <div style="text-align: center;">
          <h1>Connect to Microsoft Intune</h1>
      </div>
      <div style="display: flex; gap: 80px; margin-top: 20px">
        <div style="flex: 1">
          <!-- column 1 -->
          <h2 style="text-align: center">Entra ID Connection</h2>
          <p style="text-align: center">Log in with your Microsoft Entra account.</p>
          <button class="button secondary" id="graph-login-btn">Login Microsoft</button>
          <div id="graph-login-status" class="mt-2"></div>
        </div>
        <div style="flex: 1">
          <!-- column 2 -->
          <h2 style="text-align: center">Filters</h2>
          <h4 style="text-align: center">Owner Type</h4>
          <p style="text-align: center">Filter Intune devices by Owner Type.</p>
          <div id="ownerListContainer"></div>
        </div>
      </div>
      </div>
    `;

    // ------------------------
    // DOM references
    // ------------------------
    const loginBtn = container.querySelector("#graph-login-btn");
    const statusDiv = container.querySelector("#graph-login-status");
    //const ownerCheckboxes = container.querySelectorAll(".owner-filter");

    // ------------------------
    // 3. Owner type handling
    // -------------

    // Maak een data array van owner types
    const ownerData = ownerTypes.map(type => ({ id: type, text: type }));

    // Huidige selectie uit state
    let selectedOwners = [...state.intune.filters.ownerType];

    const ownerListBox = new ej.dropdowns.ListBox({
      dataSource: ownerData,
      fields: { text: 'text', value: 'id' },
      value: selectedOwners,  // items aanvinken op basis van state
      change: (e) => {
        let newSelected = e.value;

        // Zorg dat er minimaal 1 item geselecteerd blijft
        if (newSelected.length === 0) {
          // Zet de vorige selectie terug
          ownerListBox.value = selectedOwners;
          return;
        }

        // Update state
        selectedOwners = newSelected;
        state.intune.filters.ownerType = [...selectedOwners];
        saveSettings({ intune: state.intune.filters });
      },

      // Optioneel: checkbox-instellingen
      selectionSettings: {
        mode: 'multiple',
        showCheckbox: true,
        showSelectAll: true
      }
    });

    // Voeg de ListBox toe aan de container
    ownerListBox.appendTo('#ownerListContainer');

    // ------------------------
    // 4. Login button
    // ------------------------
    loginBtn.addEventListener("click", async () => {
      //statusDiv.innerHTML = `<div class="alert alert-info">Verbinding wordt getest...</div>`;
      statusDiv.innerHTML = `
                <div style="margin-top: 1rem">
                    <div class="notification-info">
                        <strong class="notification-title">Verbinding testen</strong>
                        <p class="notification-description">Proberen om verbinding te maken met Microsoft Intune...</p>
                    </div>
                </div>
            `;
      loginBtn.textContent = "Trying to connect..";
      loginBtn.disabled = true;
      wizardState.stepsValid[4] = false;
      updateButtons();

      try {
        const token = await loginGraph();
        state.intune.account = token.account
        state.intune.accessToken = token.accessToken;
        //saveSettings({ intune: state.intune.config });
        //console.log(token);

        //statusDiv.innerHTML = `<div class="alert alert-success">✓ Verbonden met Intune.</div>`;
        statusDiv.innerHTML = `
                    <div style="margin-top: 1rem">
                        <div class="notification-success">
                            <strong>Success</strong>
                            <p>Successfully obtained an Microsoft Graph access token. Logged on as: ${token.account.username}</p>
                        </div>
                    </div>
                `;
        loginBtn.textContent = "Login Microsoft";
        loginBtn.disabled = false;
        wizardState.stepsValid[4] = true;
        updateButtons();

      } catch (err) {
        console.error(err);
        statusDiv.innerHTML = `
           <div style="margin-top: 1rem">
                <div class="notification-error">
                    <strong>An error occured</strong>
                    <p>${err}</p>
                </div>
            </div>
        `;
        loginBtn.textContent = "Login Microsoft";
        loginBtn.disabled = false;
      }
    });

    // ------------------------
    // 5. Init wizard step validity
    // ------------------------
    wizardState.stepsValid[4] = !!state.intune.accessToken;
    updateButtons();
  }
};
