import { state } from '../components/state.js';

export const step7 = {
    title: "Summary",

    render: async (container, data, wizardState, updateButtons) => {

        // --- Gather Summary Data ---
        const {
            topdesk,
            intune,
            fieldMapping
        } = state;

        const topdeskAuthenticationUrl = topdesk?.authentication?.url || "-";
        const topdeskAuthenticationUsername = topdesk?.authentication?.username || "-";

        const selectedTemplates = topdesk?.config?.selectedTemplates || [];
        const fieldsInclude = topdesk?.config?.filters?.fields || [];
        const archiveStatus = topdesk?.config?.filters?.archiveStatus || "-";
        const statusValue = topdesk?.config?.filters?.status || "-";
        const excludeField = topdesk?.config?.filters?.excludeField?.name || null;

        const loggedOnAs = intune?.account?.username
        const ownerType = intune?.filters?.ownerType || [];

        const fieldMappingUserTopdesk = fieldMapping?.user?.topdesk || {};
        const fieldMappingUserIntune = fieldMapping?.user?.intune || {};
        const fieldMappingDeviceTopdesk = fieldMapping?.device?.topdesk || {};
        const fieldMappingDeviceIntune = fieldMapping?.device?.intune || {};

        // --- Helper: Badges ---
        const badgeList = (items, mapper = i => i) =>
            items.length
                ? items.map(i => `<span class="status-badge primary">${mapper(i)}</span>`).join(" ")
                : `<p style="color:#888">No items selected</p>`;

        // --- Container Render ---
        container.innerHTML = `
        <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
            
            <div style="text-align: center;">
                <h1>Summary</h1>
            </div>

            <div>

                <!-- Connection Settings -->
                <section>
                    <h3>Connection Settings</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <strong style="margin-bottom:5px">URL</strong><br>
                            ${topdeskAuthenticationUrl}
                        </div>
                        <div>
                            <strong>Username</strong><br>
                            ${topdeskAuthenticationUsername}
                        </div>
                    </div>
                </section>

                <hr/>

                <!-- Templates -->
                <section>
                    <h3>Templates</h3>
                    <strong>Templates</strong><br>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${badgeList(selectedTemplates, t => t.name)}
                    </div>
                </section>

                <hr/>

                <!-- Fields and Filters -->
                <section>
                    <h3>Fields and Filters</h3>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; margin-bottom: 24px;">
                        <div>
                            <strong>Fields</strong><br>
                            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                ${badgeList(fieldsInclude, f => f.name)}
                            </div>
                        </div>

                        <div>
                            <strong>Archive Status</strong><br>
                            <span style="text-transform: capitalize;">${archiveStatus}</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 40px; margin-bottom: 24px;">
                        <div>
                            <strong>Status</strong><br>
                            <span style="text-transform: capitalize;">${statusValue}</span>
                        </div>

                        <div>
                            <strong>Exclude Field</strong><br>
                            ${excludeField
                ? `<span class="status-badge primary">${excludeField}</span>`
                : `<p style="color:#888">No item selected</p>`
            }
                        </div>
                    </div>
                </section>

                <hr/>

                <!-- Microsoft Intune -->
                <section>
                    <h3>Microsoft Intune</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <strong>Logged on as</strong><br>
                            ${loggedOnAs}
                        </div>
                        <div>
                            <strong>Owner Type Filter</strong><br>
                            ${badgeList(ownerType)}
                        </div>
                    </div>
                </section>

                <hr/>

                <!-- Field Mapping -->
                <section>
                    <h3>Field Mapping</h3>

                    <!-- USER MAPPING -->
                    <div style="margin-bottom: 32px;">
                        <h4>User Mapping</h4>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong>TOPdesk</strong><br>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${fieldMappingUserTopdesk ? `<span class="status-badge primary">${fieldMappingUserTopdesk}</span>` : `<p style="color:#888">No item selected</p>`}
                                </div>
                            </div>
                            <div>
                                <strong>Intune</strong><br>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${fieldMappingUserIntune ? `<span class="status-badge primary">${fieldMappingUserIntune}</span>` : `<p style="color:#888">No item selected</p>`}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- DEVICE MAPPING -->
                    <div>
                        <h4>Device Mapping</h4>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <strong>TOPdesk</strong><br>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${fieldMappingDeviceTopdesk ? `<span class="status-badge primary">${fieldMappingDeviceTopdesk}</span>` : `<p style="color:#888">No item selected</p>`}
                                </div>
                            </div>
                            <div>
                                <strong>Intune</strong><br>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${fieldMappingDeviceIntune ? `<span class="status-badge primary">${fieldMappingDeviceIntune}</span>` : `<p style="color:#888">No item selected</p>`}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        `;

        // next button is always enabled on summary:
        wizardState.stepsValid[6] = true;
        updateButtons({ next: true, prev: true });
    }
};
