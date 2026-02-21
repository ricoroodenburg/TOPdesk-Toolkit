// step4.js
import { getTopdeskAssetFields } from '../functions/topdeskClient.js';
import { state } from '../components/state.js';
import { saveSettings, loadSettings } from '../components/storage.js';

export const step4 = {
  //title: t('terms.fieldsAndFilters'),

  render: async (container, data, wizardState, updateButtons) => {
    // --- Load saved settings ---
    const saved = loadSettings();
    if (saved?.topdesk?.config?.filters) {
      state.topdesk.config.filters = {
        ...state.topdesk.config.filters,
        ...saved.topdesk.config.filters
      };
    }

    state.topdesk.config.filters ||= {};
    state.topdesk.config.filters.fields ||= [];
    state.topdesk.config.filters.archiveStatus ||= "active";
    state.topdesk.config.filters.status ||= "operational";
    state.topdesk.config.filters.excludeField.id ||= null;
    state.topdesk.config.filters.excludeField.name ||= null;

    // --- Get fields from TOPdesk ---
    let availableFields = [];
    try {
      if (state.topdesk.config.selectedTemplates?.length) {
        availableFields = await getTopdeskAssetFields(
          state.topdesk.authentication.url,
          state.topdesk.authentication.username,
          state.topdesk.authentication.password,
          state.topdesk.config.selectedTemplates.map(t => t.id)
        );
      }
    } catch (err) {
      console.error("Kan Step 4 fields niet ophalen:", err);
    }

    const availableIds = availableFields.map(f => f.id);

    // --- Clean filters: fields ---
    state.topdesk.config.filters.fields = 
      (state.topdesk.config.filters.fields || [])
        .filter(f => availableIds.includes(f.id))
        .map(f => {
          const match = availableFields.find(a => a.id === f.id);
          return match ? { id: match.id, name: match.text } : null;
        })
        .filter(Boolean);

    // --- Clean excludeField ---
    if (!availableIds.includes(state.topdesk.config.filters.excludeField?.id)) {
      state.topdesk.config.filters.excludeField.id = null;
      state.topdesk.config.filters.excludeField.name = null;
    }

    saveSettings({ topdesk: { config: { filters: state.topdesk.config.filters } } });

    // --- Render UI ---
    container.innerHTML = `
      <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
        <div style="text-align: center;">
          <h1>Fields and Filters</h1>
        </div>
        <div style="display: flex; gap: 80px; margin-top: 20px">
          <div style="flex: 1">
            <h2 style="text-align: center">Fields</h2>
            <p style="text-align: center">Select additional fields to include in the overview.</p>
            <div style="padding: 0 0 10px 0;">
              <div class="form-field__row">
                <svg aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" class="form-field__help-icon" viewBox="0 0 512 512">
                  <path fill="currentColor" d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336c-13.3 0-24 10.7-24 24s10.7 24 24 24l80 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-8 0 0-88c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l24 0 0 64-24 0zm40-144a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"></path>
                </svg>
                <p>The fields shown below are retrieved based on the template(s) selected in step 3.</p>
              </div>
            </div>
            <div id="fieldsContainer"></div>
          </div>
          <div style="flex: 1; text-align: center">
            <h2 style="text-align: center">Filters</h2>
            <h4>Archive Status</h4>
            <p style="text-align: center">Whether to show archived assets.</p>
            <div id="archiveToggleContainer" class="toggle-button-group"></div>
            <h4>Status</h4>
            <p style="text-align: center">To filter assets by their status.</p>
            <div id="statusToggleContainer" class="toggle-button-group"></div>
            <h4>Exclude Field</h4>
            <p style="text-align: center">Skip assets where the selected checkbox field is checked.</p>
            <div id="excludeComboContainer"></div>
          </div>
        </div>
      </div>
    `;

    // --- ComboBox: Exclude field ---
    const comboData = availableFields
      .filter(f => f.icon === "checkboxfield")
      .map(f => ({ id: f.id, text: f.text }));

    const selectedExcludeFieldId = state.topdesk.config.filters.excludeField?.id || null;

    const excludeCombo = new ej.dropdowns.ComboBox({
      dataSource: comboData,
      fields: { text: 'text', value: 'id' },
      placeholder: "Select a field",
      allowCustom: false,
      value: comboData.find(item => item.id === selectedExcludeFieldId)?.id || null,
      change: (e) => {
        const selectedId = e.value;
        const fieldObj = availableFields.find(f => f.id === selectedId);
        
        state.topdesk.config.filters.excludeField = fieldObj
          ? { id: fieldObj.id, name: fieldObj.text }
          : null;

        console.log(state.topdesk.config.filters.excludeField);
        saveSettings({ topdesk: { config: { filters: state.topdesk.config.filters } } });
      }
    });

    excludeCombo.appendTo('#excludeComboContainer');

    // --- Toggle buttons ---
    const archiveOptions = [{ label: 'Active', value: 'active' }, { label: 'Archived', value: 'archived' }, { label: 'All', value: 'all' }];
    const statusOptions = [{ label: 'Operational', value: 'operational' }, { label: 'Impacted', value: 'impacted' }, { label: 'All', value: 'all' }];

    const archiveContainer = container.querySelector("#archiveToggleContainer");
    const statusContainer = container.querySelector("#statusToggleContainer");

    archiveContainer.innerHTML = '';
    statusContainer.innerHTML = '';

    archiveOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.className = 'toggle-button';
      if (state.topdesk.config.filters.archiveStatus === opt.value) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        state.topdesk.config.filters.archiveStatus = opt.value;
        saveSettings({ topdesk: { config: { filters: state.topdesk.config.filters } } });
        archiveContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      archiveContainer.appendChild(btn);
    });

    statusOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.className = 'toggle-button';
      if (state.topdesk.config.filters.status === opt.value) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        state.topdesk.config.filters.status = opt.value;
        saveSettings({ topdesk: { config: { filters: state.topdesk.config.filters } } });
        statusContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      statusContainer.appendChild(btn);
    });

    // --- ListBox: Fields ---
    const topdeskFields = availableFields.map(f => ({ id: f.id, text: f.text }));
    const selectedFieldIds = state.topdesk.config.filters.fields.map(f => f.id);

    const listObj = new ej.dropdowns.ListBox({
      dataSource: topdeskFields,
      fields: { text: 'text', value: 'id' },
      value: selectedFieldIds,
      selectionSettings: { mode: 'multiple', showCheckbox: true, showSelectAll: true },
      change: (e) => {
        state.topdesk.config.filters.fields = e.value.map(id => {
          const f = availableFields.find(f => f.id === id);
          return f ? { id: f.id, name: f.text } : { id, name: "" };
        });
        saveSettings({ topdesk: { config: { filters: state.topdesk.config.filters } } });
      }
    });

    listObj.appendTo('#fieldsContainer');

    // --- Step valid ---
    wizardState.stepsValid[3] = true;
    updateButtons();
  }
};
