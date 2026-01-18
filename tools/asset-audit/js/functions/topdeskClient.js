const moduleName = 'topdeskClient';

export async function testConnection(topdeskUrl, topdeskUsername, password) {

    // Variables
    const functionName = 'testConnection';
    let version;
    const endpoint = `${topdeskUrl}/tas/api/productVersion`;

    try {

        console.info(`[${moduleName}][${functionName}] Request URI: ${endpoint}`);

        // Request
        const response = await fetch(endpoint, {
            headers: {
                Authorization: 'Basic ' + btoa(`${topdeskUsername}:${password}`),
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        console.info(`[${moduleName}][${functionName}] Status: ${response.status}`);

        // ✅ Succesvolle 2xx-respons
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {

                const data = await response.json();
                version = `${data.major}.${data.minor}.${data.patch}`;

                console.info(`[${moduleName}][${functionName}] Request successful`)
                console.info(`[${moduleName}][${functionName}] TOPdesk version ${version} detected`)
                return version;

            } else {
                return await response.text(); // fallback als het geen JSON is
            }
        }

        // ❌ Client error (4xx)
        if (response.status >= 400 && response.status < 500) {
            let errorText;
            switch (response.status) {
                case 401:
                    errorText = statusMessage401;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`${errorText} (${response.status})`)
                case 403:
                    errorText = statusMessage403;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`${errorText} (${response.status})`)
                default:
                    errorText = await response.text();
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
            }
        }

        // 🔥 Server error (5xx)
        if (response.status >= 500) {
            console.error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
            throw new Error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
        }

        // 📛 Onbekende status
        console.error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
        throw new Error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);

    }catch(err){
        console.error(`[${moduleName}][${functionName}] Error: ${err.message}`);
        throw err;
    }


}

// Asset Management - Templates
export async function getAssetTemplates(topdeskUrl, topdeskUsername, password) {

    const functionName = 'getAssetTemplates';
    let output = [];
    const endpoint = `${topdeskUrl}/tas/api/assetmgmt/templates?archived=false`

    try {
        console.info(`[${moduleName}][${functionName}] Request URI: ${endpoint}`);
        const response = await fetch(endpoint, {
            headers: {
                Authorization: 'Basic ' + btoa(`${topdeskUsername}:${password}`),
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        // Log status
        console.info(`[${moduleName}][${functionName}] Status: ${response.status}`);

        // ✅ Succesvolle 2xx-respons
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {

                const data = await response.json();
                output = data.dataSet;

                console.info(`[${moduleName}][${functionName}] Request successful`)
                console.info(`[${moduleName}][${functionName}] ${output?.length} items fetched`)
                return output;

            } else {
                return await response.text(); // fallback als het geen JSON is
            }
        }

        // ❌ Client error (4xx)
        if (response.status >= 400 && response.status < 500) {
            let errorText;
            switch (response.status) {
                case 401:
                    errorText = statusMessage401;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`${errorText} (${response.status})`)
                case 403:
                    errorText = statusMessage403;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`${errorText} (${response.status})`)
                default:
                    errorText = await response.text();
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
            }
        }

        // 🔥 Server error (5xx)
        if (response.status >= 500) {
            console.error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
            throw new Error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
        }

        // 📛 Onbekende status
        console.error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
        throw new Error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);

    } catch (err) {
        console.error(`[${moduleName}][${functionName}] Error: ${err.message}`);
        throw err;
    }
}

export async function getTopdeskAssetFields(topdeskUrl, topdeskUsername, password, templateIds = []) {

    const functionName = 'getTopdeskAssetFields';
    let output = [];

    const params = new URLSearchParams();
    templateIds.forEach(id => params.append('templateId', id));
    params.append('includeFromVisibleTemplatesOnly', 'true');
    params.append('resourceCategory', 'asset');
    params.append('includeInUse', 'true');

    const endpoint = `${topdeskUrl}/tas/api/assetmgmt/fields?${params.toString()}`;

    try {
        console.info(`[${moduleName}][${functionName}] Request URI: ${endpoint}`);
        const response = await fetch(endpoint, {
            headers: {
                Authorization: 'Basic ' + btoa(`${topdeskUsername}:${password}`),
                'Content-Type': 'application/x.topdesk-am-fields-v2+json',
                Accept: 'application/json',
            },
        });

        // Log status
        console.info(`[${moduleName}][${functionName}] Status: ${response.status}`);

        // ✅ Succesvolle 2xx-respons
        if (response.ok) {

            const data = await response.json();
            output = (data?.dataSet ?? [])
                .filter((field) => field.id && field.text)
                .sort((a, b) => a.text.localeCompare(b.text));

            console.info(`[${moduleName}][${functionName}] Request successful`)
            console.info(`[${moduleName}][${functionName}] ${output?.length} items fetched`)
            return output;

        }

        // ❌ Client error (4xx)
        if (response.status >= 400 && response.status < 500) {
            let errorText;
            switch (response.status) {
                case 401:
                    errorText = statusMessage401;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`${errorText} (${response.status})`)
                case 403:
                    errorText = statusMessage403;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`${errorText} (${response.status})`)
                default:
                    errorText = await response.text();
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`[${functionName}] Client error ${response.status}: ${errorText}`);
            }
        }

        // 🔥 Server error (5xx)
        if (response.status >= 500) {
            console.error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
            throw new Error(`[${functionName}] Server error ${response.status}: ${response.statusText}`);
        }

        // 📛 Onbekende status
        console.error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
        throw new Error(`[${functionName}] Unexpected response status: ${response.status}`);

    } catch (err) {
        console.error(`[${moduleName}][${functionName}] Error: ${err.message}`);
        throw err;
    }
}

// Asset Management - Assets
export async function getAssets({
    topdeskUrl,
    topdeskUsername,
    password,
    templates,
    field,
    fieldQuery,
    archived,
    status,
    excludeFieldId,
}) {
    const functionName = 'getAssets';
    let output = [];
    let lastAssetID = null;
    let hasMoreRecords = true;

    while (hasMoreRecords) {
        // Stel de request body samen als een JSON-object
        const requestBody = {
            templateId: templates.map((t) => t.id || t), // Meerdere templates als array
            fields: `name,${field},@assignments,@stock,@type,${fieldQuery},${excludeFieldId}`,
            fetchCount: true,
            pageSize: 1000,
            resolveDropdownOptions: true,
        };

        // Voeg optionele parameters toe aan de body
        if (status) requestBody.assetStatus = status;
        if (archived !== 'all' && archived !== undefined) requestBody.archived = archived;
        if (lastAssetID) requestBody.$filter = `name gt '${lastAssetID}'`; // Filter met lastAssetID

        const endpoint = `${topdeskUrl}/tas/api/assetmgmt/assets/filter`; // Nieuwe endpoint

        try {
            console.info(`[${moduleName}][${functionName}] Request URI: ${endpoint}`);
            console.debug(JSON.stringify(requestBody, null, 2));

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: 'Basic ' + btoa(`${topdeskUsername}:${password}`),
                    'Content-Type': 'application/json', 
                    Accept: 'application/json',
                },
                body: JSON.stringify(requestBody),
            });


            console.info(`[${moduleName}][${functionName}] Status: ${response.status}`);

            // ✅ Succesvolle response
            if (response.ok) {
                const data = await response.json();
                const currentAssets = data?.dataSet || [];

                output = output.concat(currentAssets);

                if (currentAssets.length === 0) {
                    hasMoreRecords = false;
                } else {
                    lastAssetID = currentAssets[currentAssets.length - 1].name; // Update lastAssetID
                }

                continue;
            }

            // ❌ Client errors
            if (response.status >= 400 && response.status < 500) {
                let errorText;
                switch (response.status) {
                    case 401:
                        errorText = statusMessage401;
                        console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                        throw new Error(`${errorText} (${response.status})`);
                    case 403:
                        errorText = statusMessage403;
                        console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                        throw new Error(`${errorText} (${response.status})`);
                    default:
                        errorText = await response.text();
                        console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                        throw new Error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                }
            }

            // 🔥 Server errors
            if (response.status >= 500) {
                console.error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
                throw new Error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
            }

            // 📛 Onbekende status
            console.error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
            throw new Error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
        } catch (err) {
            console.error(`[${moduleName}][${functionName}] Error: ${err.message}`);
            throw err;
        }
    }

    // Output
    console.info(`[${moduleName}][${functionName}] Request successful`);
    console.info(`[${moduleName}][${functionName}] ${output?.length} items fetched`);
    return output;
}

export async function getAssetRelationHistory({ topdeskUrl, topdeskUsername, password, assetId }) {
    const functionName = 'getAssetRelationHistory';
    let output = [];

    if (!topdeskUrl || !topdeskUsername || !password) {
        throw new Error(`[${functionName}] Missing TOPdesk credentials`);
    }
    if (!assetId) throw new Error(`[${functionName}]  Missing assetId`);


    const endpoint = `${topdeskUrl}/tas/api/assetmgmt/assets/${assetId}/history/pastItems?excludedCategories=asset_management_document_modifications,asset_management_status,asset_management_assignment_modifications,incident_management_filter,knowledge_item_filter,problem_management_filter,change_management_filter,operations_management_filter,asset_management_reservation_setting_modifications,asset_management_modifications`

    try {
        console.debug(`[${moduleName}][${functionName}] Request URI: ${endpoint}`);
        const response = await fetch(endpoint, {
            headers: {
                Authorization: 'Basic ' + btoa(`${topdeskUsername}:${password}`),
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        // Log status
        console.debug(`[${moduleName}][${functionName}] Status: ${response.status}`);

        // ✅ Succesvolle 2xx-respons
        if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {

                const data = await response.json();

                if (!data?.items || !Array.isArray(data.items)) {
                    throw new Error(`[${functionName}] Unexpected response shape: 'items' missing`);
                }

                output = data.items;

                console.debug(`[${moduleName}][${functionName}] Request successful`)
                console.debug(`[${moduleName}][${functionName}] ${output?.length} items fetched`)
                return output;

            } else {
                //return await response.text(); // fallback als het geen JSON is
                const fallback = await response.text();
                throw new Error(`Expected JSON but got: ${fallback.slice(0, 100)}...`);
            }
        }

        // ❌ Client error (4xx)
        if (response.status >= 400 && response.status < 500) {
            let errorText;
            console.error('ERROR!!!');
            switch (response.status) {
                case 401:
                    errorText = statusMessage401;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText} - URI: ${endpoint}`);
                    throw new Error(`${errorText} (${response.status})`)
                case 403:
                    errorText = statusMessage403;
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText} - URI: ${endpoint}`);
                    throw new Error(`${errorText} (${response.status})`)
                default:
                    errorText = await response.text();
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText} - URI: ${endpoint}`);
                    throw new Error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
            }
        }

        // 🔥 Server error (5xx)
        if (response.status >= 500) {
            console.error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
            throw new Error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
        }

        // 📛 Onbekende status
        console.error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
        throw new Error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);

    } catch (err) {
        console.error(endpoint);
        console.error(`[${moduleName}][${functionName}] Error: ${err} - status ${err.status}`);
        throw err;
    }
}

// Supporting Files - Persons

export async function getPersonsByIds({ topdeskUrl, topdeskUsername, password, personIds = [], batchSize = 100, fields = [] }) {
    const functionName = 'getPersonsByIds';
    const personMap = {};

    console.info(`[${moduleName}][${functionName}] Start`);
    const uniqueIds = [...new Set(personIds.filter(Boolean))];

    if (uniqueIds.length === 0) {
        console.warn(`[${moduleName}][${functionName}] No valid person IDs provided`);
        return {};
    }

    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
        batches.push(uniqueIds.slice(i, i + batchSize));
    }

    console.info(`[${moduleName}][${functionName}] ${uniqueIds.length} unique IDs split into ${batches.length} batch(es)`);

    try {
        // Start alle batch fetches parallel
        const fetchPromises = batches.map(async (batch, index) => {
            const fiql = batch.map(id => `id==${id}`).join(',');
            let nextUrl = `${topdeskUrl}/tas/api/persons?query=${encodeURIComponent(fiql)}&pageSize=5000&fields=${fields.join(',')}`;
            const persons = {};

            while (nextUrl) {
                console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Request URI: ${nextUrl}`);
                const response = await fetch(nextUrl, {
                    headers: {
                        Authorization: 'Basic ' + btoa(`${topdeskUsername}:${password}`),
                        Accept: 'application/x.topdesk-collection-person-v2+json',
                    },
                });

                console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Status: ${response.status}`);

                if (response.ok) {
                    const data = await response.json();
                    (data.item || []).forEach(p => {
                        persons[p.id] = p;
                    });
                    nextUrl = data.next ? `${topdeskUrl}${data.next}` : null;
                } else {
                    let errorText;
                    try {
                        const errorDetails = await response.json();
                        errorText = JSON.stringify(errorDetails, null, 2);
                    } catch {
                        errorText = await response.text();
                    }

                    if (response.status >= 400 && response.status < 500) {
                        switch (response.status) {
                            case 401:
                                errorText = statusMessage401 || errorText;
                                break;
                            case 403:
                                errorText = statusMessage403 || errorText;
                                break;
                        }
                        console.error(`[${moduleName}][${functionName}] [Batch ${index + 1}] Client error ${response.status}: ${errorText}`);
                        throw new Error(`${errorText} (${response.status})`);
                    } else if (response.status >= 500) {
                        console.error(`[${moduleName}][${functionName}] [Batch ${index + 1}] Server error ${response.status}: ${response.statusText}`);
                        throw new Error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
                    } else {
                        console.error(`[${functionName}] [Batch ${index + 1}] Unexpected response status: ${response.status}`);
                        throw new Error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
                    }
                }
            }

            return persons;
        });

        const allResults = await Promise.all(fetchPromises);

        allResults.forEach(batchResult => {
            Object.assign(personMap, batchResult);
        });

        console.info(`[${moduleName}][${functionName}] ✅ Fetched successfully: ${Object.keys(personMap).length} persons`);
        return personMap;

    } catch (err) {
        console.error(`[${moduleName}][${functionName}] ❌ Error: ${err.message}`);
        throw err;
    }
}