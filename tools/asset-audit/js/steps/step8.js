import SegmentedProgressBar from '../components/progressbar.js';
import { getAssets, getPersonsByIds, getAssetRelationHistory } from '../functions/topdeskClient.js';
import { getIntuneDevices, fetchUserBatch } from '../functions/microsoftGraph.js'
import { state } from '../components/state.js';

export const step8 = {
  title: t('terms.result'),
    render: async (container, data, wizardState) => {
        const steps = [
            "Collect Assets",
            "Collect Persons",
            "Collect Stock Info",
            "Merge Assets, Persons and Stock",
            "Collect Intune Device",
            "Collect Intune Person Assignment Details",
        ];

        container.innerHTML = `
        <div style="padding: 0px; min-width: 400px; margin: 0 auto">
            <div id="error-wrapper"></div>
            <div id="progress-wrapper"></div>
            <div id="summary-wrapper" style="display: flex;gap: 16px;margin-bottom: 16px;flex-wrap: wrap;justify-content: center;"></div>
            <div id="grid-wrapper"></div>
        </div>
        `;

        const summaryWrapper = document.getElementById('summary-wrapper');


        // progress-wrapper bestaat nu pas → nu is het DOM-element beschikbaar
        function renderLoading(state, currentStep) {
            const wrapper = document.getElementById("progress-wrapper");

            wrapper.innerHTML = ""; // altijd leegmaken

            if (state) {
                const overlay = document.createElement("div");
                overlay.className = "loading-overlay";

                const bar = SegmentedProgressBar({
                    steps,
                    currentStep,
                    gap: 10
                });

                overlay.appendChild(bar);
                wrapper.appendChild(overlay);
            }
        }

        // Error Message Block
        function setErrorMessage(title, message) {
            if (message) {
                const errorDiv = container.querySelector("#error-wrapper");
                errorDiv.innerHTML = `
                <div style="margin-top: 1rem">
                    <div class="notification-error">
                        <strong class="notification-title">${title}</strong>
                        <p class="notification-description">${message}</p>
                    </div>
                </div>
            `;
                // Disable loading
                renderLoading(false);
            }
        }

        // Set variables
        const topdeskUrl = state.topdesk.authentication.url;
        const topdeskUsername = state.topdesk.authentication.username;
        const password = state.topdesk.authentication.password;
        const selectedTemplates = state.topdesk.config.selectedTemplates.map(t => t.id);
        const selectedFields = state.topdesk.config.filters.fields.map(t => t.id).join(',');
        const archived = state.topdesk.config.filters.archiveStatus == 'all' ? 'all' : state.topdesk.config.filters.archiveStatus == 'archived' ? true : false;
        const status = state.topdesk.config.filters.status == 'all' ? null : state.topdesk.config.filters.status;
        const excludeFieldId = state.topdesk.config.filters.excludeField.id;
        const memoizedFieldTopdesk = state.fieldMapping.device.topdesk
        const userField = state.fieldMapping.user.intune
        const deviceFieldIntune = state.fieldMapping.device.intune
        const userFieldTopdesk = state.fieldMapping.user.topdesk
        const graphToken = state.intune.accessToken;

        async function fetchAll() {

            try {
                //setCurrentStep(1);
                renderLoading(true, 1);
                console.log('[Debug] Step 1 - Fetching assets...');
                const assetsRaw = await fetchAssets();
                console.log('[Debug] Step 1 - Fetching assets done.');

                renderLoading(true, 2);
                console.log('[Debug] Step 2 - Fetching persons...');
                const personsMap = await fetchPersons(assetsRaw);
                console.log('[Debug] Step 2 - Fetching persons done.');

                renderLoading(true, 3);
                console.log('[Debug] Step 3 - Fetching stock relation history...');
                const stockAssignmentMap = await fetchStockRelationHistory(assetsRaw);
                console.log('[Debug] Step 3 - Fetching stock relation history done.');
                //if (!stockAssignmentMap) throw new Error('Failed to fetch stock relation history');

                renderLoading(true, 4);
                console.log('[Debug] Step 4 - Combining data...');
                const enrichedAssets = combineData(assetsRaw, personsMap, stockAssignmentMap);
                console.log('[Debug] Step 4 - Combining data done.');

                renderLoading(true, 5);
                console.log('[Debug] Step 5 - Fetching Intune devices...');
                const intuneDevices = await fetchIntuneDevices(assetsRaw);
                console.log('[Debug] Step 5 - Fetching Intune devices done.');
                //if (!intuneDevices) throw new Error('Failed to fetch Intune devices');

                renderLoading(true, 6);
                console.log('[Debug] Step 6 - Matching Intune devices with assets...');
                const updatedAssets = enrichedAssets.map((asset) => {
                    const serialNumberRaw = asset[memoizedFieldTopdesk];
                    const serialNumber = serialNumberRaw ? serialNumberRaw.toLowerCase().trim() : '';
                    const intuneDevice = serialNumber
                        ? intuneDevices.find((dev) => dev[deviceFieldIntune].toLowerCase().trim() === serialNumber)
                        : null;

                    //console.log(intuneDevice);
                    // Logica voor tasLogins en userPrincipal
                    const tasRaw = asset[`assignmentPerson_${userFieldTopdesk}`] || '';
                    const tasLogins = new Set(
                        tasRaw
                            .toLowerCase()
                            .split(/[,;\s]+/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                    );

                    const userPrincipal = intuneDevice?.lastLoggedOnUserUserPrincipalName?.toLowerCase().trim() || '';

                    const matchUser =
                        !intuneDevice || !userPrincipal || tasLogins.has(userPrincipal);

                    // Bereken lastLoginDate
                    let lastLoginDate = '';
                    if (intuneDevice?.usersLoggedOn?.length) {
                        const mostRecentUser = intuneDevice.usersLoggedOn.reduce((latest, user) => {
                            if (!latest || new Date(user.lastLogOnDateTime) > new Date(latest.lastLogOnDateTime)) {
                                return user;
                            }
                            return latest;
                        }, null);
                        lastLoginDate = mostRecentUser?.lastLogOnDateTime || '';
                    }

                    // Bereken postStockActivity
                    let postStockActivity = false;
                    if (asset['@stock']) {
                        const stockDate = new Date(asset.stockAssignmentDate || 0);
                        const enrolledDate = new Date(intuneDevice?.enrolledDateTime || 0);
                        const syncDate = new Date(intuneDevice?.lastSyncDateTime || 0);
                        const lastLogin = new Date(lastLoginDate || 0);

                        postStockActivity =
                            enrolledDate > stockDate ||
                            syncDate > stockDate ||
                            lastLogin > stockDate;
                    }

                    // Voeg alles toe aan het verrijkte asset
                    return {
                        ...asset,
                        intuneDevice,
                        matchUser,
                        lastLoginDate,
                        postStockActivity,
                    };
                });
                console.log('[Debug] Step 6 - Matching Intune devices with assets done.');

                // Calculate
                const excludedDevicesCount = updatedAssets.filter(a => a[excludeFieldId]).length;
                const totalDevices = updatedAssets.length - excludedDevicesCount;
                const matchedDevices = updatedAssets.filter(asset => asset.matchUser && !asset[excludeFieldId]).length;
                const unmatchedDevices = updatedAssets.filter(asset => asset.matchUser === false && !asset[excludeFieldId]).length;
                const stockAndPersonAssets = updatedAssets.filter(asset => asset['@stock'] && asset.assignmentPersons && !asset[excludeFieldId]).length;
                const archivedPersonLinkedAssets = updatedAssets.filter(asset => asset.assignmentPerson_archived && !asset[excludeFieldId]).length;
                const postStockActivityCount = updatedAssets.filter(asset => asset.postStockActivity && !asset[excludeFieldId]).length;

                // Counts
                //console.log(`Total number of Excluded Devices: ${excludedDevicesCount}`);
                //console.log(`Total number of Devices: ${totalDevices}`);
                //console.log(`Total number of Matched devices: ${matchedDevices}`);
                //console.log(`Total number of Unmachted devices: ${unmatchedDevices}`);
                //console.log(`Total number of Devices which are assigned to stock and person: ${stockAndPersonAssets}`);
                //console.log(`Total number of Devices which are assigned to archived person: ${archivedPersonLinkedAssets}`);
                //console.log(`Total number of Devices which are used after assigning to stock: ${postStockActivityCount}`);


                return {
                    updatedAssets,
                    excludedDevicesCount,
                    totalDevices,
                    matchedDevices,
                    unmatchedDevices,
                    stockAndPersonAssets,
                    archivedPersonLinkedAssets,
                    postStockActivityCount
                };


            } catch (err) {
                console.error('[Error] Error in fetchAll:', err.message);
                //setErrorMessage(err.message || 'An unknown error occurred');
                setErrorMessage("Error in fetchAll", err.message || 'An unknown error occurred')
                //setStepCompleted(false);
            } finally {
                renderLoading(false, 0);
            }

        }

        // Start progress
        const {
            updatedAssets,
            excludedDevicesCount,
            totalDevices,
            matchedDevices,
            unmatchedDevices,
            stockAndPersonAssets,
            archivedPersonLinkedAssets,
            postStockActivityCount
        } = await fetchAll();

        // Stap 1: Fetch Assets
        async function fetchAssets() {
            try {
                //setLoadingStatus('Step 1 - Fetching assets...');
                const assets = await getAssets({
                    topdeskUrl,
                    topdeskUsername,
                    password,
                    templates: selectedTemplates,
                    field: memoizedFieldTopdesk,
                    fieldQuery: selectedFields,
                    archived: archived,
                    status: status,
                    excludeFieldId: excludeFieldId,
                });
                //console.log('Fetched assets:', assets);
                return assets;
            } catch (err) {
                console.error('Failed to fetch assets:', err.message);

                // Set error
                setErrorMessage("Failed to fetch assets", err.message)
                throw new Error(`Error fetching assets: ${err.message}`);
            }
        }

        // Stap 2: Fetch Persons
        async function fetchPersons(assetsRaw) {
            try {
                //setLoadingStatus('Step 2 |-Fetching persons...');
                const allPersonIds = [];
                assetsRaw.forEach((asset) => {
                    const persons = asset['@assignments']?.persons || [];
                    persons.forEach((p) => {
                        if (p.person?.id) allPersonIds.push(p.person.id);
                    });
                });

                const fields = ['id', userFieldTopdesk, 'archived'];
                const personsMap = await getPersonsByIds({
                    topdeskUrl,
                    topdeskUsername,
                    password,
                    personIds: allPersonIds,
                    fields,
                });
                //console.log('Fetched persons:', personsMap);
                return personsMap;
            } catch (err) {
                console.error('Failed to fetch persons:', err.message);

                // Set error
                setErrorMessage("Error fetching person", err.message)
                throw new Error(`Error fetching persons: ${err.message}`);

            }
        }

        // Stap 3: Fetch Stock Relation History
        async function fetchStockRelationHistory(assetsRaw) {
            try {
                //setLoadingStatus('Step 3 - Fetching stock relation history...');
                //console.log(`Step 3 - Fetching stock relation history for ${assetsRaw.length} assets.`);

                const stockDataPerAsset = await Promise.all(
                    assetsRaw.map(async (asset) => {
                        if (!asset['@stock']) {
                            return { assetId: asset.unid, stockAssignmentDate: null };
                        }

                        try {
                            const relationHistory = await getAssetRelationHistory({
                                topdeskUrl,
                                topdeskUsername,
                                password,
                                assetId: asset.unid,
                            });

                            // Filter de juiste relaties
                            const matches = Array.isArray(relationHistory)
                                ? relationHistory.filter(
                                    (rel) =>
                                        rel.relationship?.message?.link?.capabilityId === "dad98dad-054b-41ae-a727-3e3b37342739"
                                )
                                : [];

                            // Sorteer aflopend op datum en pak de eerste (nieuwste)
                            const latestMatch = matches.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                            return {
                                assetId: asset.unid,
                                stockAssignmentDate: latestMatch?.date || null
                            };
                        } catch (err) {
                            console.warn(`Failed to fetch stock relation history for asset ${asset.unid}:`, err.message);
                            return {
                                assetId: asset.unid,
                                stockAssignmentDate: null
                            };
                        }
                    })
                );

                // Bouw de stockAssignmentMap
                const stockAssignmentMap = {};
                stockDataPerAsset.forEach(({ assetId, stockAssignmentDate }) => {
                    //console.log(assetId);
                    stockAssignmentMap[assetId] = stockAssignmentDate;
                });

                //console.log(JSON.stringify(stockAssignmentMap, null, 2));
                return stockAssignmentMap;
            } catch (err) {
                console.error('Failed to fetch stock relation history:', err.message);

                // Set error
                setErrorMessage("Error fetching stock relation history", err.message)
                throw new Error(`Error fetching stock relation history: ${err.message}`);
            }
        }

        // Stap 4: Combine data
        function combineData(assetsRaw, personsMap, stockAssignmentMap) {
            try {
                //console.log('[Debug] Combining data...');
                //console.log('[Debug] assetsRaw:', JSON.stringify(assetsRaw, null, 2));
                //console.log('[Debug] personsMap:', JSON.stringify(personsMap, null, 2));
                //console.log('[Debug] stockAssignmentMap:', JSON.stringify(stockAssignmentMap, null, 2));

                //setLoadingStatus('Step 4 - Merge assets, persons, stock and Intune device data...');

                return assetsRaw.map((asset, index) => {
                    try {
                        //console.log(`[Debug] Processing asset at index ${index}:`, JSON.stringify(asset, null, 2));

                        const persons = asset['@assignments']?.persons || [];
                        const assetData = {};
                        const assetId = asset.unid;

                        // Voeg data van personen toe
                        const fields = ['id', userFieldTopdesk, 'archived'];
                        fields.forEach((field) => {
                            assetData[`assignmentPerson_${field}`] = persons
                                .map((p) => {
                                    const personObj = p.person && personsMap[p.person.id];
                                    return personObj ? personObj[field] : null;
                                })
                                .filter(Boolean)
                                .join(', ');
                        });

                        // Controleer of alleen personen zijn toegewezen (geen groepen)
                        const onlyPersons = persons.every((p) => p.person && !p.persongroup);
                        const assignmentPersons = onlyPersons
                            ? persons.map((p) => p.person.name).join(', ')
                            : '';

                        // Controleer of het assetId in stockAssignmentMap staat
                        if (!stockAssignmentMap.hasOwnProperty(assetId)) {
                            console.warn(`[Warning] Missing stockAssignmentMap entry for assetId: ${assetId}`);
                        }

                        return {
                            ...asset,
                            assignmentPersons,
                            ...assetData,
                            stockAssignmentDate: stockAssignmentMap[assetId] || null,
                            inStock: !!stockAssignmentMap[assetId],
                        };
                    } catch (err) {
                        console.error(`[Error] Failed to process asset at index ${index}:`, err.message);
                        return null; // Laat dit asset overslaan bij een fout
                    }
                }).filter(Boolean); // Verwijder assets die null zijn vanwege fouten
            } catch (err) {
                console.error('[Error] Error combining data:', err.message);

                // Set error
                setErrorMessage("Error combining data", err.message)
                throw new Error(`Error combining data: ${err.message}`);

            }
        }

        // Stap 5: Fetch Intune Devices
        async function fetchIntuneDevices(assetsRaw) {
            try {
                if (!graphToken || assetsRaw.length === 0) return;
                //setLoadingStatus('Step 5 - Fetching Intune devices...');
                console.log('Step 5 - Fetching Intune devices...');

                // Unieke serienummers uit [Organization Name]s halen
                const serialNumbersSet = new Set();
                assetsRaw.forEach((asset) => {
                    const sn = asset[memoizedFieldTopdesk];
                    if (sn) serialNumbersSet.add(sn);
                });
                const serialNumbers = Array.from(serialNumbersSet);

                // Extra filter
                const extraFilter = state.intune.filters.ownerType?.map(value => `ownerType eq '${value}'`).join(' or ') || null;

                // Intune devices ophalen
                const devices = await getIntuneDevices({
                    graphToken,
                    serialNumbers,
                    extraFilter,
                    fieldName: deviceFieldIntune
                });
                //console.log('Fetched Intune devices:', devices);

                // Map van devices per serial number, en set van userIds
                const userIds = new Set();
                const deviceMap = {};
                //console.log(devices);
                devices.forEach((device) => {
                    //if (!device.serialNumber) return;
                    if (!device[deviceFieldIntune]) return;

                    const enrolledDate = new Date(device.enrolledDateTime);

                    /*
                    if (
                        !deviceMap[device.serialNumber] ||
                        enrolledDate > new Date(deviceMap[device.serialNumber].enrolledDateTime)
                    ) {
                        deviceMap[device.serialNumber] = device;
                    }*/

                    if (
                        !deviceMap[device[deviceFieldIntune]] ||
                        enrolledDate > new Date(deviceMap[device[deviceFieldIntune]].enrolledDateTime)
                    ) {
                        deviceMap[device[deviceFieldIntune]] = device;
                    }

                    const users = device.usersLoggedOn || [];
                    users.forEach((user) => {
                        user._lastLogOnDate = new Date(user.lastLogOnDateTime); // cache date
                    });

                    const mostRecentUser = users.reduce((latest, user) => {
                        if (!latest || user._lastLogOnDate > latest._lastLogOnDate) return user;
                        return latest;
                    }, null);

                    if (mostRecentUser?.userId) userIds.add(mostRecentUser.userId);
                });

                // User principal values ophalen in batches
                const userPrincipalMap = {};
                const userBatchSize = 20;
                const userBatchArray = Array.from(userIds);

                const userBatches = [];
                for (let i = 0; i < userBatchArray.length; i += userBatchSize) {
                    userBatches.push(userBatchArray.slice(i, i + userBatchSize));
                }

                const batchResponses = await Promise.all(
                    userBatches.map((batch) => fetchUserBatch(graphToken, batch))
                );

                //console.log(batchResponses);

                batchResponses.forEach((data) => {
                    (data.responses || []).forEach((resp) => {
                        if (resp.status === 200 && resp.body) {
                            userPrincipalMap[resp.body.id] = resp.body[userField];
                        }
                    });
                });

                //console.log(userPrincipalMap);


                // Verrijk devices met userPrincipalName
                Object.values(deviceMap).forEach((device) => {
                    const users = device.usersLoggedOn || [];
                    const mostRecentUser = users.reduce((latest, user) => {
                        if (!latest || user._lastLogOnDate > latest._lastLogOnDate) return user;
                        return latest;
                    }, null);
                    if (mostRecentUser?.userId) {
                        device.lastLoggedOnUserUserPrincipalName =
                            userPrincipalMap[mostRecentUser.userId] || null;
                    }
                });

                return Object.values(deviceMap); // Retourneer de verrijkte devices
            } catch (err) {
                console.error('Failed to fetch Intune devices:', err.message);

                // Set error
                setErrorMessage("Error fetching Intune devices", err.message)
                throw new Error(`Error fetching Intune devices: ${err.message}`);

            }
        }

        function applyGridFilter(filters = []) {
            if (!window.grid) return;

            grid.clearFiltering();

            filters.forEach(f => {
                grid.filterByColumn(f.field, f.operator, f.value);
            });

            // Zet grid terug naar eerste pagina
            grid.pageSettings.currentPage = 1;
            grid.refresh();
        }

        // Filters als aparte functies
        const filterTotalDevices = () => applyGridFilter([
            { field: excludeFieldId, operator: 'equal', value: false }
        ]);

        const filterUnmatchedDevices = () => applyGridFilter([
            { field: 'matchUser', operator: 'equal', value: false },
            { field: excludeFieldId, operator: 'equal', value: false }
        ]);

        const filterMatchedDevices = () => applyGridFilter([
            { field: 'matchUser', operator: 'equal', value: true },
            { field: excludeFieldId, operator: 'equal', value: false }
        ]);

        const filterAssignedToArchivedPerson = () => applyGridFilter([
            { field: 'assignmentPerson_archived', operator: 'equal', value: true },
            { field: excludeFieldId, operator: 'equal', value: false }
        ]);

        const filterStockAndAssignment = () => applyGridFilter([
            { field: '@stock', operator: 'notequal', value: '' },
            { field: `assignmentPerson_${userFieldTopdesk}`, operator: 'notequal', value: '' },
            { field: excludeFieldId, operator: 'equal', value: false }
        ]);

        const applyPostStockActivityFilter = () => applyGridFilter([
            { field: 'postStockActivity', operator: 'equal', value: true },
            { field: excludeFieldId, operator: 'equal', value: false }
        ]);

        const applyexcludedDevicesFilter = () => applyGridFilter([
            { field: excludeFieldId, operator: 'equal', value: true }
        ]);


        // container div in je page
        summaryWrapper.innerHTML = ''; // clear

        const summaryData = [
            {
                label: "Total Devices",
                title: "Total number of devices currently tracked in the system.",
                count: totalDevices,
                styleName: 'summarize_block',
                onClick: filterTotalDevices
            },
            {
                label: "Matched Devices",
                title: "Devices where the Intune device information matches the recorded user assignment.",
                count: matchedDevices,
                styleName: 'summarize_block',
                onClick: filterMatchedDevices
            },
            {
                label: "Unmatched Devices",
                title: "Devices where the Intune device info does NOT match the assigned user, indicating possible data mismatch or missing info.",
                count: unmatchedDevices,
                styleName: unmatchedDevices ? 'summarize_block_error' : 'summarize_block_success',
                onClick: filterUnmatchedDevices
            },
            {
                label: "Stock and Persons",
                title: "Devices currently assigned to both stock and a person. This can indicate potential double assignments or configuration issues.",
                count: stockAndPersonAssets,
                styleName: stockAndPersonAssets ? 'summarize_block_error' : 'summarize_block_success',
                onClick: filterStockAndAssignment
            },
            {
                label: "Archived Persons",
                title: "Devices assigned to persons who have been archived, which might mean outdated or inactive user assignments.",
                count: archivedPersonLinkedAssets,
                styleName: archivedPersonLinkedAssets ? 'summarize_block_error' : 'summarize_block_success',
                onClick: filterAssignedToArchivedPerson
            },
            {
                label: "Post-Stock activity",
                title: `Count of assets that are currently in stock where one or more of these dates are more recent than the "In Stock Since" date:
- Enrollment Date (Intune)
- Last Sync Date (Intune)
- Last Logged On Date (User activity)

Indicates activity after the asset was assigned to stock.`,
                count: postStockActivityCount,
                styleName: postStockActivityCount ? 'summarize_block_error' : 'summarize_block_success',
                onClick: applyPostStockActivityFilter
            },
            {
                label: "Excluded devices",
                title: "Show devices that are excluded",
                count: excludedDevicesCount,
                styleName: 'summarize_block',
                onClick: applyexcludedDevicesFilter
            }
        ];

        summaryData.forEach(item => {
            const div = document.createElement('div');
            div.className = item.styleName;
            div.title = item.title;
            div.style.cursor = item.count ? 'pointer' : 'not-allowed';
            if (item.count && item.onClick) {
                div.addEventListener('click', item.onClick);
            }

            // Label
            const labelDiv = document.createElement('div');
            labelDiv.style.fontSize = '0.8rem';
            labelDiv.style.fontWeight = 'bold';
            labelDiv.textContent = item.label;

            // Count
            const countDiv = document.createElement('div');
            countDiv.style.fontSize = '1.5rem';
            countDiv.textContent = item.count;

            div.appendChild(labelDiv);
            div.appendChild(countDiv);

            summaryWrapper.appendChild(div);
        });

        const toolbarOptions = [
            { text: "Search", align: 'Left' },

            //{ text: 'Change Assignments', tooltipText: '', prefixIcon: 'e-edit', id: 'btChangeAssignment', align: 'Right' },
            //{ text: 'Open in TOPdesk', tooltipText: '', prefixIcon: 'e-open-link', id: 'btOpenInTopdesk', align: 'Right' },
            //{ text: 'Open in Intune', tooltipText: '', prefixIcon: 'e-open-link', id: 'btOpenInIntune', align: 'Right' },
            { text: "Export XLSX", align: 'Right', tooltipText: '', prefixIcon: 'e-export-excel', id: 'exportXlsx' },

            ///{ text: t('terms.expandAll'), align: 'Right', tooltipText: t('tooltips.expandAll'), prefixIcon: 'e-chevron-down', id: 'expandall' },
            //{ text: t('terms.collapseAll'), align: 'Right', tooltipText: t('tooltips.collapseAll'), prefixIcon: 'e-chevron-up', id: 'collapseall' }
        ];

        const dynamicColumns = state.topdesk.config.filters.fields
            .filter(f => f.id !== 'name' && f.id !== excludeFieldId)
            .map(f => ({
                field: f.id,
                headerText: f.name,
                allowFiltering: false,
                valueAccessor: (fieldName, data) => {
                    const val = data[fieldName];
                    return val && typeof val === 'object' && 'name' in val ? val.name : val;
                }
            }));



        // Instantieer de Syncfusion Grid
        window.grid = new ej.grids.Grid({
            dataSource: updatedAssets,
            allowPaging: true,
            pageSettings: { pageSize: 100 },
            allowFiltering: true,
            filterSettings: { type: 'Excel' },
            allowResizing: true,
            allowReordering: true,
            allowSorting: true,
            allowMultiSorting: true,
            selectionSettings: { type: 'Multiple' },
            columns: [
                { type: 'checkbox', width: 50, freeze: 'Left' },
                {
                    field: 'name', headerText: 'Asset ID', freeze: 'Left', template: function (props) {
                        return `<a href="${state.topdesk.authentication.url}/tas/secure/openpage.jsp?url=/tas/secure/assetmgmt/card.html?unid=${props.unid}" target="_blank" class="url">${props.name}</a>`;
                    }
                },
                { field: 'unid', headerText: 'Asset UNID', visible: false, isPrimaryKey: true },
                {
                    field: 'archived', headerText: 'Archived', width: 130, template: function (props) {
                        return `<span class="status-badge ${props.archived ? 'danger' : 'success'}">${props.archived ? 'Archived' : 'Active'}</span>`;
                    }
                },
                {
                    field: '@status', headerText: 'Status', width: 130, template: function (props) {
                        return `<span class="status-badge ${props['@status'] === 'IMPACTED' ? 'danger' : 'success'}">${props['@status'] === 'IMPACTED' ? 'Impacted' : 'Operational'}</span>`;
                    }
                },
                {
                    field: 'inStock', headerText: 'In Stock', width: 120, template: function (props) {
                        return `<span class="status-badge ${props.inStock ? 'warning' : 'success'}">${props.inStock ? 'Yes' : 'No'}</span>`;
                    }
                },
                { field: `assignmentPerson_${userFieldTopdesk}`, headerText: 'Person' },
                {
                    field: 'intuneDevice.lastLoggedOnUserUserPrincipalName', headerText: 'Last Logged On User', width: 250, valueAccessor: function (field, data) {
                        return data.intuneDevice?.lastLoggedOnUserUserPrincipalName || '';
                    }
                },
                {
                    field: 'matchUser', headerText: 'Match', width: 130, textAlign: 'Center', template: function (props) {
                        const intuneDevice = props.intuneDevice;
                        const userPrincipal = intuneDevice?.lastLoggedOnUserUserPrincipalName?.toLowerCase().trim() || '';
                        const tasLogins = new Set((props[`assignmentPerson_${userFieldTopdesk}`] || '').toLowerCase().split(/[,;\s]+/).filter(Boolean));
                        const matchUser = !intuneDevice || !userPrincipal || tasLogins.has(userPrincipal);
                        return `<span class="status-badge ${matchUser ? 'success' : 'danger'}">${matchUser ? 'True' : 'False'}</span>`;
                    }
                },
                { field: 'lastLoginDate', headerText: 'Last Login Date', width: 180, type: 'datetime', format: 'dd MMM yyyy HH:mm' },
                { field: '@type.name', headerText: 'Template', width: 200 },
                ...dynamicColumns,
                { field: '@stock', headerText: 'Stock', width: 120 },
                { field: 'stockAssignmentDate', headerText: 'In Stock Since', width: 180, type: 'datetime', format: 'dd MMM yyyy HH:mm' },
                {
                    field: 'assignmentPerson_archived', headerText: 'Person Status', template: function (props) {
                        return `<span class="status-badge ${props.assignmentPerson_archived ? 'danger' : 'success'}">${props.assignmentPerson_archived ? 'Archived' : 'Active'}</span>`;
                    }
                },
                { field: 'intuneDevice.deviceName', headerText: 'Intune Device Name', width: 200 },
                { field: 'intuneDevice.serialNumber', headerText: 'Intune Device Serial Number', width: 200 },
                { field: 'intuneDevice.id', headerText: 'Intune Device ID', visible: false },
                { field: 'intuneDevice.userPrincipalName', headerText: 'Intune Primary User', width: 200 },
                { field: 'intuneDevice.operatingSystem', headerText: 'Operating System', width: 150 },
                {
                    field: 'intuneDevice.complianceState', headerText: 'Compliance State', width: 150, template: function (props) {
                        const value = props.intuneDevice?.complianceState;
                        let cls = 'status-badge', label = '';
                        switch (value) {
                            case 'compliant': cls += ' success'; label = 'Compliant'; break;
                            case 'noncompliant': cls += ' danger'; label = 'Noncompliant'; break;
                            case 'configManager': cls += ' success'; label = 'See ConfigMgr'; break;
                            case 'inGracePeriod': cls += ' warning'; label = 'Grace Period'; break;
                            default: label = value || '';
                        }
                        return `<span class="${cls}">${label}</span>`;
                    }
                },
                { field: 'intuneDevice.lastSyncDateTime', headerText: 'Last Sync', width: 180, type: 'datetime', format: 'dd MMM yyyy HH:mm' },
                { field: 'intuneDevice.enrolledDateTime', headerText: 'Enrolled Date', width: 180, type: 'datetime', format: 'dd MMM yyyy HH:mm' },
                {
                    field: 'intuneDevice.ownerType', headerText: 'Owner', width: 150, template: function (props) {
                        const val = props.intuneDevice?.ownerType;
                        return val === 'company' ? 'Company' : val === 'personal' ? 'Personal' : '';
                    }
                },
                { field: 'postStockActivity', headerText: 'Post Activity', width: 150, visible: false },
                { field: excludeFieldId, headerText: 'Exclude from audit', width: 150, visible: false },

            ],
            // services
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            allowResizing: true,
            allowReordering: true,
            allowExcelExport: true,
            showColumnMenu: true,
            toolbar: toolbarOptions,
            selectionSettings: { type: 'Multiple' },
            height: '55vh',
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
            toolbarClick: clickHandler
        });


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

                case 'exportXlsx':
                    window.grid.excelExport();
                    break;

                case 'grid-wrapper_csvexport':
                    window.grid.csvExport();
                    break;

                default:
                    console.info(`No action found for ${args.item.id}`);

            };

        }

        // Render de grid
        window.grid.appendTo('#grid-wrapper');

        // Next knop meteen beschikbaar
        wizardState.stepsValid[7] = true;
        // updateButtons moet ook via wizardState (of via een helper)
        if (typeof updateButtons === 'function') updateButtons();
    }
};