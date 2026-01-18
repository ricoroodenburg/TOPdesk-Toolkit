async function initGrid() {
    try {

        const data = await loadData();

        const toolbarOptions = [
            { text: "Search", align: 'Left' },
            { text: t('terms.expandAll'), align: 'Right', tooltipText: t('tooltips.expandAll'), prefixIcon: 'e-chevron-down', id: 'expandall' },
            { text: t('terms.collapseAll'), align: 'Right', tooltipText: t('tooltips.collapseAll'), prefixIcon: 'e-chevron-up', id: 'collapseall' }
        ];

        const filterSettings = {
            type: 'Excel'
        };

        window.grid = new ej.grids.Grid({
            dataSource: data,
            enablePersistence: true,
            enableAdaptiveUI: true,
            adaptiveUIMode: 'Mobile',
            height: '100%',
            created: function () {
                setTimeout(() => {
                    const searchBar = document.getElementById(grid.element.id + "_searchbar");
                    if (searchBar) {
                        searchBar.addEventListener('keyup', function (event) {
                            grid.search(event.target.value);
                        });
                    }
                }, 0);
            },
            allowPaging: true,
            pageSettings: { pageSize: 20 },
            allowSorting: true,
            sortSettings: { columns: [{ field: 'releaseDate', direction: 'Descending' }] },
            allowMultiSorting: true,
            showColumnMenu: true,
            allowFiltering: true,
            filterSettings: filterSettings,
            allowGrouping: true,
            toolbar: toolbarOptions,
            toolbarClick: clickHandler,
            groupSettings: { columns: ['releaseDate'], showDropArea: false, captionTemplate: '#captiontemplate' },
            allowResizing: true,
            allowReordering: true,
            emptyRecordTemplate: `
                <div class='no-results' style="text-align: center;">
                    <img src="emptyRecordTemplate.svg" class="e-emptyRecord" alt="No record" style="height: 88.2%; max-height: 360px">
                    <br>
                    <h2>${t('messages.noSearchResult')}</h2>
                    <p>${t('messages.searchTryAgain')}</p>
                </div>
            `,
            columns: [
                { field: "release", headerText: t('terms.release'), width: 100 },
                { field: "releaseDate", headerText: t('terms.releaseDate'), width: 140, type: 'date', format: 'yyyy-MM-dd' },
                { field: "descriptionHtml", headerText: t('terms.description'), width: 350, template: d => `<div style="white-space:normal;">${d.descriptionHtml}</div>`, allowGrouping: false },
                { field: "category", headerText: t('terms.category'), width: 150 },
                { field: "subcategory", headerText: t('terms.subcategory'), width: 150 },
                {
                    headerText: t('terms.source'), width: 100, template: d => {
                        if (d.source === "production") return `<span class="status-badge success">${t('terms.feature')}</span>`;
                        if (d.source === "api") return `<span class="status-badge primary">${t('terms.api')}</span>`;
                        return "";
                    }
                },
                {
                    field: "hostingType", headerText: "Hosting", width: 100, template: d => {
                        let html = "";
                        if (d.hosting?.saas)
                            html += `<span class="status-badge success" style="margin-right:5px">SAAS</span>`;

                        if (d.hosting?.["on-premises virtual appliance"])
                            html += `<span class="status-badge primary" style="margin-right:5px">Virtual Appliance</span>`;

                        if (d.hosting?.["on-premises classic"])
                            html += `<span class="status-badge danger">Classic</span>`;

                        return html;
                    }
                },
                { field: "isTosNote", headerText: "TOS", width: 80, template: d => d.isTosNote ? `<span class="status-badge success">${t('terms.true')}</span>` : `<span class="status-badge danger">${t('terms.false')}</span>`, visible: false }
            ],
            rowDataBound: function (args) {
                if (args.data.attentions?.highlight) args.row.classList.add('highlight-row');
            }
        });

        grid.appendTo('#grid');

    } catch (e) {
        console.error("Failed to initialize grid:", e);
    }
}

function clickHandler(args) {
    switch (args.item.id) {

        case 'expandall':
            console.debug(`${args.item.id} invoked`);
            grid.groupModule.expandAll();
            break;

        case 'collapseall':
            console.debug(`${args.item.id} invoked`);
            grid.groupModule.collapseAll();
            break;

        default:
            console.info(`No action found for ${args.item.id}`);

    };

}

function template(args) {
    const date = args.key;
    if (!(date instanceof Date)) return `${args.headerText}: ${args.key}`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${args.headerText}: ${day}-${month}-${year}`;
}

initGrid();