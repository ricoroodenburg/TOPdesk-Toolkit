// state.js
import { loadSettings } from "./storage.js";

export const state = {
    topdesk: {
        authentication: {
            url: "",
            username: "",
            password: "",
        },
        config: {
            selectedTemplates: [],
            filters: {
                archiveStatus: "",
                excludeField:{
                    id: "",
                    name: ""
                },
                fields: [],
                status: ""
            }
        }
    }
};

// Bij starten direct proberen eerder opgeslagen settings te laden
const stored = loadSettings();
if (stored?.topdesk) {

    // Authentication
    state.topdesk.authentication.url = stored.topdesk.authentication.url || "";
    state.topdesk.authentication.username = stored.topdesk.authentication.username || "";
    
    // Templates
    if (stored?.topdesk?.config?.selectedTemplates){state.topdesk.config.selectedTemplates = stored.topdesk.config.selectedTemplates || ""};
    
    // Filters
    //state.topdesk.config.filters.archiveStatus = state.topdesk.config.filters.archiveStatus || "";
    //state.topdesk.config.filters.excludeField = state.topdesk.config.filters.excludeField || "";
    //state.topdesk.config.filters.fields = state.topdesk.config.filters.fields || [];
    //state.topdesk.config.filters.status = state.topdesk.config.filters.status || "";
    
    
}
