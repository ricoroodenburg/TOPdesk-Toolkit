// =========================
// Configuration
// =========================

// Je TOPdesk omgeving:
const TOPDESK_URL = "";

// Application password of base64(login:password)
const topdeskUsername = "";
const password = ""

async function loadData() {
    //
    // 1. Load all roles (rechtengroepen)
    //

    console.log(btoa(`Basic ${topdeskUsername}:${password}`),)
    const endpoint = `${TOPDESK_URL}/services/permissions/roles`;
    const roles = await fetch(endpoint, {
        headers: {
            Authorization: `Basic ${btoa(`${topdeskUsername}:${password}`)}`,
            'Content-Type': 'application/json',
            Accept: '*/*',
        }}
        ).then(r => r.json());
    console.log(roles);

    //
    // 2. Load detailed role info (permissions + principals)
    //
    const roleDetails = [];
    for (const role of roles) {
        const detail = await fetch(
            `${TOPDESK_URL}/services/permissions/reporting/1.0.0/roles?$filter=id eq ${role.id}`,
            { headers: { "Authorization": `Basic ${API_KEY}` } }
        ).then(r => r.json());

        roleDetails.push(...detail);
    }

    //
    // 3. Build a map of principal → permissions & role origins
    //
    const principalMap = {};

    for (const role of roleDetails) {
        const permissions = role.assignedPermissions;
        const principals = role.principals;

        for (const principal of principals) {
            if (!principalMap[principal]) {
                principalMap[principal] = {
                    principalId: principal,
                    permissions: new Set(),
                    roleSources: {}
                };
            }

            permissions.forEach(p => principalMap[principal].permissions.add(p));

            principalMap[principal].roleSources[role.id] = permissions;
        }
    }

    //
    // 4. Get readable operator names
    //
    for (const principalId of Object.keys(principalMap)) {
        const operator = await fetch(
            `${TOPDESK_URL}/tas/api/operators?query=principalId==${principalId}&fields=id,loginName,firstName,surName`,
            { headers: { "Authorization": `Basic ${API_KEY}` } }
        ).then(r => r.json());

        principalMap[principalId].name = `${operator[0].firstName} ${operator[0].surName}`;
    }

    //
    // 5. Convert permissions into a matrix row
    //
    const rows = [];

    for (const principalId of Object.keys(principalMap)) {
        const obj = principalMap[principalId];

        const baseRow = {
            name: obj.name,
            type: "Behandelaar",
            principalId: principalId
        };

        // permissions as "X" in the matrix
        obj.permissions.forEach(p => {
            baseRow[p] = "X";
        });

        rows.push(baseRow);

        // Add sub-rows for role sources
        for (const [roleId, perms] of Object.entries(obj.roleSources)) {
            const roleRow = {
                name: `↳ ${roleId}`,
                type: "Rechtengroep",
                principalId: principalId
            };

            perms.forEach(p => {
                roleRow[p] = "X";
            });

            rows.push(roleRow);
        }
    }

    return rows;
}

//
// Helper to convert "tos::incident::read" → module + header (Incident → Read)
//
function buildColumnStructure(rows) {
    const permissionKeys = new Set();

    rows.forEach(r => {
        Object.keys(r).forEach(k => {
            if (k.startsWith("tos::")) permissionKeys.add(k);
        });
    });

    const columns = [
        { field: "name", headerText: "Behandelaar / Groep", width: 200 },
        { field: "type", headerText: "Type", width: 120 }
    ];

    const grouped = {};

    permissionKeys.forEach(key => {
        const parts = key.split("::"); // tos::incident::read
        const module = parts[1];
        const action = parts[2];

        if (!grouped[module]) grouped[module] = [];
        grouped[module].push({ field: key, headerText: action.toUpperCase(), width: 120 });
    });

    for (const module of Object.keys(grouped)) {
        columns.push({
            headerText: module.charAt(0).toUpperCase() + module.slice(1),
            columns: grouped[module]
        });
    }

    return columns;
}

//
// Renders Syncfusion Grid
//
async function initGrid() {
    try {
        const matrix = await loadData();
        const columns = buildColumnStructure(matrix);

        window.grid = new ej.grids.Grid({
            dataSource: matrix,
            enableAdaptiveUI: true,
            adaptiveUIMode: 'Mobile',
            height: '100%',
            allowSorting: true,
            allowFiltering: true,
            allowPaging: true,
            pageSettings: { pageSize: 50 },
            allowGrouping: true,
            groupSettings: { columns: ["principalId"], showDropArea: false },
            allowResizing: true,
            allowReordering: true,

            toolbar: [
                { text: "Search", align: "Left" },
                { text: "Expand All", align: "Right", id: "expandall", prefixIcon: "e-chevron-down" },
                { text: "Collapse All", align: "Right", id: "collapseall", prefixIcon: "e-chevron-up" }
            ],

            toolbarClick: function (args) {
                if (args.item.id === "expandall") grid.groupModule.expandAll();
                if (args.item.id === "collapseall") grid.groupModule.collapseAll();
            },

            columns: columns
        });

        grid.appendTo("#permissionsGrid");

    } catch (e) {
        console.error("Failed to initialize grid:", e);
    }
}

initGrid();
