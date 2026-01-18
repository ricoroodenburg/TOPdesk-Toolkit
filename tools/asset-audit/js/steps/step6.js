import { getTopdeskAssetFields } from '../functions/topdeskClient.js';
import { state } from '../components/state.js';
import { saveSettings, loadSettings } from '../components/storage.js';

export const step6 = {
    title: "Field Mapping",
    render: async (container, data, wizardState, updateButtons) => {

        // -----------------------------------------
        // Load Settings
        // -----------------------------------------
        const saved = loadSettings();
        if (saved?.fieldMapping) {
            state.fieldMapping = {
                ...state.fieldMapping,
                ...saved.fieldMapping
            };
        }

        // -----------------------------------------
        // Get TOPdesk Asset Management Fields and filter out only textfields
        // -----------------------------------------
        let availableFields = [];
        try {
            availableFields = await getTopdeskAssetFields(
                state.topdesk.authentication.url,
                state.topdesk.authentication.username,
                state.topdesk.authentication.password,
                state.topdesk.config.selectedTemplates.map(t => t.id)
            )
        } catch (err) {
            console.error("Kan Step 6 fields niet ophalen:", err);
        }

        const topdeskDeviceFields = availableFields
            .filter(f => f.icon === "textfield")
            .map(f => ({ id: f.id, text: f.text }));

        // --- Container render ---
        container.innerHTML = `
        <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
            <div style="text-align: center;">
                <h1>Field Mapping</h1>
            </div>

            <!-- USER MATCHING -->
            <div style="text-align: center">
                <h2>User Matching</h2>
                <p>Bepaalt hoe gebruikers tussen Intune en TOPdesk worden herkend.</p>
            </div>
            <div id="mapping-grid-um" style="display: grid; grid-template-columns: 1fr 40px 1fr; column-gap: 20px; row-gap: 0px; align-items: center;">
                <p style="text-align: center">TOPdesk</p>
                <div style="text-align:center; font-size: 20px;"></div>
                <p style="text-align: center">Microsoft Intune</p>
                <div id="um-topdesk"></div>
                <div style="text-align:center; font-size: 20px;"><p>→</p></div>
                <div id="um-intune"></div>
            </div>

            <!-- DEVICE MATCHING -->
            <div style="text-align: center; margin-top: 40px;">
                <h2>Device Matching</h2>
                <p>Bepaalt hoe apparaten tussen Intune en TOPdesk worden herkend.</p>
            </div>
            <div id="mapping-grid-dm" style="display: grid; grid-template-columns: 1fr 40px 1fr; column-gap: 20px; row-gap: 0px; align-items: center;">
                <p style="text-align: center">TOPdesk</p>
                <div style="text-align:center; font-size: 20px;"></div>
                <p style="text-align: center">Microsoft Intune</p>
                <div id="dm-topdesk"></div>
                <div style="text-align:center; font-size: 20px;"><p>→</p></div>
                <div id="dm-intune"></div>
            </div>
        </div>
        `;

        // --- Datasources ---
        const intuneUserFields = [
            { id: "userPrincipalName", text: "userPrincipalName" },
            { id: "samAccountName", text: "samAccountName" },
            { id: "email", text: "email" }
        ];

        const topdeskUserFields = [
            { id: "email", text: "Email" },
            { id: "loginname", text: "Login Name" },
            { id: "networkLogin", text: "Network Login" }
        ];

        const intuneDeviceFields = [
            { id: "serialNumber", text: "serialNumber" },
            { id: "deviceId", text: "deviceId" }
        ];

        // --- Initialize state.fieldMapping ---
        state.fieldMapping ||= {};
        state.fieldMapping.user ||= {};
        state.fieldMapping.device ||= {};

        // -----------------------------------------
        // Helper to create ComboBoxes + binding
        // -----------------------------------------
        const createCombo = (selector, datasource, fieldPath) => {

            // Controleer of de opgeslagen waarde nog in de datasource zit
            let initialValue = fieldPath.reduce((obj, key) => obj[key], state.fieldMapping);
            // bestaat de opgeslagen waarde nog?
            if (!datasource.some(d => d.id === initialValue)) {

                // waarde bestaat niet → verwijder uit state
                let obj = state.fieldMapping;
                for (let i = 0; i < fieldPath.length - 1; i++) {
                    const key = fieldPath[i];
                    obj[key] ||= {};
                    obj = obj[key];
                }

                obj[fieldPath[fieldPath.length - 1]] = null;
                saveSettings({ fieldMapping: state.fieldMapping });

                // en combobox niet preselecten
                initialValue = null;
            }


            const combo = new ej.dropdowns.ComboBox({
                dataSource: datasource,
                fields: { text: "text", value: "id" },
                placeholder: "Select field",
                allowCustom: false,
                value: initialValue,
                change: (e) => {
                    // opslaan in state
                    let obj = state.fieldMapping;
                    for (let i = 0; i < fieldPath.length - 1; i++) {
                        const key = fieldPath[i];
                        obj[key] ||= {};
                        obj = obj[key];
                    }
                    obj[fieldPath[fieldPath.length - 1]] = combo.value;
                    saveSettings({ fieldMapping: state.fieldMapping });

                    // Hide popup
                    combo.hidePopup();

                    // check validation
                    checkValidation();
                }
            });
            combo.appendTo(selector);

            /*
            // Event: update state bij selectie
            combo.addEventListener('change', (e) => {
                // opslaan in state
                let obj = state.fieldMapping;
                for (let i = 0; i < fieldPath.length - 1; i++) {
                    const key = fieldPath[i];
                    obj[key] ||= {};
                    obj = obj[key];
                }
                obj[fieldPath[fieldPath.length - 1]] = combo.value;
                saveSettings({ fieldMapping: state.fieldMapping });

                // check validation
                checkValidation();
            });
            */
        };

        // -----------------------------------------
        // Create User Matching
        // -----------------------------------------
        createCombo("#um-intune", intuneUserFields, ["user", "intune"]);
        createCombo("#um-topdesk", topdeskUserFields, ["user", "topdesk"]);

        // -----------------------------------------
        // Create Device Matching
        // -----------------------------------------
        createCombo("#dm-intune", intuneDeviceFields, ["device", "intune"]);
        createCombo("#dm-topdesk", topdeskDeviceFields, ["device", "topdesk"]);

        // -----------------------------------------
        // Validation function
        // -----------------------------------------
        const checkValidation = () => {
            const valid = state.fieldMapping.user.intune &&
                state.fieldMapping.user.topdesk &&
                state.fieldMapping.device.intune &&
                state.fieldMapping.device.topdesk;

            wizardState.stepsValid[5] = !!valid;
            updateButtons();
        };

        // init validation check
        checkValidation();

    }
};
