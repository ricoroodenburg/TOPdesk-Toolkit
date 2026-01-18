import { getAssetTemplates } from '../functions/topdeskClient.js';
import { state } from '../components/state.js';
import { saveSettings } from '../components/storage.js';

export const step3 = {
  title: "Templates",
  render: async (container, data, wizardState, updateButtons) => {
    container.innerHTML = `
    <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto">
      <div style="text-align: center;">
          <h1>Select Templates</h1>
          <p>Choose one or more templates to audit.</p>
      </div>
      <div style="padding: 0px 0px 10px 0px;">
        <div>
          <div class="form-field__row">
            <svg aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" class="form-field__help-icon" viewBox="0 0 512 512">
              <path fill="currentColor" d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336c-13.3 0-24 10.7-24 24s10.7 24 24 24l80 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-8 0 0-88c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l24 0 0 64-24 0zm40-144a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"></path>
            </svg>
            <p>The templates shown below are retrieved based on the permissions of the operator specified in step 2.</p>
          </div>
        </div>
      </div>

      <div id="td-templates" class="mb-3">
          <p>Templates worden geladen...</p>
      </div>
    </div>
    `;

    const templatecontainer = container.querySelector("#td-templates");
    try {
      const templates = await getAssetTemplates(
        state.topdesk.authentication.url,
        state.topdesk.authentication.username,
        state.topdesk.authentication.password
      );

      // --- Filter oude selectie ---
      //const selected = state.topdesk.config.selectedTemplates || [];
      //const validSelected = selected.filter(id => templates.some(t => t.id === id));
      //state.topdesk.config.selectedTemplates = validSelected;

      const selected = state.topdesk.config.selectedTemplates || [];
      const validSelected = selected
        .map(sel => {
          const match = templates.find(t => t.id === (sel.id || sel));
          return match ? { id: match.id, name: match.text } : null;
        })
        .filter(Boolean);

      state.topdesk.config.selectedTemplates = validSelected;


      // Save filtered selection
      saveSettings({ topdesk: { config: { selectedTemplates: validSelected.slice() } } });

      // --- Render templates grid ---
      templatecontainer.innerHTML = renderTemplateGrid(templates);

      // --- Hook selectie logic ---
      hookTemplateSelection(container, wizardState, updateButtons);

    } catch (err) {
      templatecontainer.innerHTML = `
            <div class="alert alert-danger">
                Kan templates niet ophalen: ${err.message}
            </div>
        `;
    }

    // --- Helper: render templates ---
    function renderTemplateGrid(templates) {
      return `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; overflow-y: auto; padding: 10px;">
          ${templates.map(t => `
              <div class="selector">
                <div><b>${t.text}</b></div>
                <div style="font-size: 12px;"><i>${t.id || ""}</i></div>
              </div>
          `).join('')}
        </div>
    `;
    }

    // --- Helper: handle selection ---
    function hookTemplateSelection(container, wizardState, updateButtons) {
      const selectors = container.querySelectorAll(".selector");

      selectors.forEach(selector => {
        const id = selector.querySelector('i').textContent || ""; // neem id uit het <i>

        // Init selectie
        //if (state.topdesk.config.selectedTemplates.includes(id)) {
        if (state.topdesk.config.selectedTemplates.some(x => x.id === id)) {
          applySelectorStyle(selector, true);
        }

        selector.addEventListener("click", () => {
          let isSelected;
          /*
          let selected = state.topdesk.config.selectedTemplates;

         
          if (selected.includes(id)) {
            // Deselect
            state.topdesk.config.selectedTemplates = selected.filter(x => x !== id);
            isSelected = false;
          } else {
            // Select
            state.topdesk.config.selectedTemplates.push(id);
            isSelected = true;
          }
            */
          let selected = state.topdesk.config.selectedTemplates;

          // check of id al bestaat
          const exists = selected.some(x => x.id === id);

          if (exists) {
            // Deselect
            state.topdesk.config.selectedTemplates =
              selected.filter(x => x.id !== id);
            isSelected = false;
          } else {
            // Select: sla id + naam op
            const name = selector.querySelector('b').textContent;
            state.topdesk.config.selectedTemplates.push({ id, name });
            isSelected = true;
          }


          // Pas visuele stijl aan
          applySelectorStyle(selector, isSelected);

          // Save naar localStorage
          saveSettings({
            topdesk: { config: { selectedTemplates: state.topdesk.config.selectedTemplates.slice() } }
          });

          // Update wizard validatie
          console.log(state.topdesk.config.selectedTemplates.length);
          wizardState.stepsValid[2] = state.topdesk.config.selectedTemplates.length > 0;
          updateButtons();
        });
      });

      // --- Cruciaal: check direct bij laden ---
      wizardState.stepsValid[2] = state.topdesk.config.selectedTemplates.length > 0;
      updateButtons();
    }

    // Helper functie: pas achtergrond en kleur aan
    function applySelectorStyle(selector, selected) {
      selector.classList.toggle('selected', selected);
    }

  }
};
