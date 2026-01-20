const moduleName = 'microsoftGraph';

// GUI error messages
const statusMessage401 = 'Unauthorized, please check the credentials of the App Registration.';
const statusMessage403 = 'Forbidden, please check the permissions of the App Registration.';

/*
export async function getIntuneDevices({ graphToken, serialNumbers, extraFilter = '', fieldName }) {
    console.log(fieldName);
    const functionName = 'getIntuneDevices';
    const baseUrl = 'https://graph.microsoft.com/beta/deviceManagement/managedDevices';
    const batchSize = 50;
    const output = [];

    console.info(`[${moduleName}][${functionName}] Start`);
    console.log(extraFilter);
    const uniqueSerials = [...new Set(serialNumbers.filter(Boolean))];

    if (uniqueSerials.length === 0) {
        console.warn(`[${moduleName}][${functionName}] No valid serial numbers provided`);
        return [];
    }

    const batches = [];
    for (let i = 0; i < uniqueSerials.length; i += batchSize) {
        batches.push(uniqueSerials.slice(i, i + batchSize));
    }

    console.info(`[${moduleName}][${functionName}] ${uniqueSerials.length} unique serial numbers split into ${batches.length} batch(es)`);

    try {
        
        const fetchPromises = batches.map(async (batch, index) => {
            //const filterSerials = batch.map(sn => `serialNumber eq '${sn}'`).join(' or ');
            const filterSerials = batch.map(sn => `${fieldName} eq '${sn}'`).join(' or ');
            let filterQuery = filterSerials;
            if (extraFilter) {
                filterQuery = `(${filterSerials}) and (${extraFilter})`;
            }

            let nextLink = `${baseUrl}?$filter=${encodeURIComponent(filterQuery)}&$select=id,ownerType,serialNumber,deviceName,operatingSystem,usersLoggedOn,lastSyncDateTime,enrolledDateTime,complianceState,userPrincipalName`;
            const results = [];

            console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Fetching devices`);

            while (nextLink) {
                const response = await fetch(nextLink, {
                    headers: {
                        Authorization: `Bearer ${graphToken}`,
                        Accept: 'application/json',
                    },
                });

                console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Status: ${response.status}`);

                if (response.ok) {
                    const data = await response.json();
                    if (data.value?.length) {
                        results.push(...data.value);
                        console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Received ${data.value.length} devices`);
                    }
                    nextLink = data['@odata.nextLink'] || null;
                } else {
                    let errorText;
                    try {
                        const errorDetails = await response.json();
                        errorText = JSON.stringify(errorDetails, null, 2);
                    } catch {
                        errorText = await response.text();
                    }
                    // ❌ Client error (4xx)
                    if (response.status >= 400 && response.status < 500) {
                        let errorText;
                        switch (response.status) {
                            case 401:
                                errorText = statusMessage401 || errorText;
                                console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                                throw new Error(`${errorText} (${response.status})`);
                            case 403:
                                errorText = statusMessage403 || errorText;
                                console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                                throw new Error(`${errorText} (${response.status})`);
                            default:
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
                }
            }

            return results;
        });

        const allResults = await Promise.all(fetchPromises);

        allResults.forEach(batchDevices => output.push(...batchDevices));
        console.log(`[${moduleName}][${functionName}] Request successful`)
        console.log(`[${moduleName}][${functionName}] ${output?.length} items fetched`)
        return output;

    } catch (err) {
        console.error(`[${moduleName}][${functionName}] ❌ Error: ${err.message}`);
        throw err;
    }
}
*/

export async function getIntuneDevices({ graphToken, serialNumbers, extraFilter = '', fieldName }) {

    const functionName = 'getIntuneDevices';
    const baseUrl = 'https://graph.microsoft.com/beta/deviceManagement/managedDevices';
    //const batchSize = 50;
    const batchSize = fieldName === 'id' ? 20 : 50;
    const output = [];

    console.info(`[${moduleName}][${functionName}] Start`);
    console.log(extraFilter);

    const uniqueIdsOrSerials = [...new Set(serialNumbers.filter(Boolean))];

    if (uniqueIdsOrSerials.length === 0) {
        console.warn(`[${moduleName}][${functionName}] No valid identifiers provided`);
        return [];
    }

    const batches = [];
    for (let i = 0; i < uniqueIdsOrSerials.length; i += batchSize) {
        batches.push(uniqueIdsOrSerials.slice(i, i + batchSize));
    }

    console.info(`[${moduleName}][${functionName}] ${uniqueIdsOrSerials.length} unique items split into ${batches.length} batch(es)`);

    try {
        const fetchPromises = batches.map(async (batch, index) => {
            const results = [];

            // ✅ Special handling for 'id' field
            if (fieldName === 'id') {
                for (const id of batch) {
                    /*
                    const deviceUrl = `${baseUrl}/${encodeURIComponent(id)}?$select=id,ownerType,serialNumber,deviceName,operatingSystem,usersLoggedOn,lastSyncDateTime,enrolledDateTime,complianceState,userPrincipalName`;

                    const response = await fetch(deviceUrl, {
                        headers: {
                            Authorization: `Bearer ${graphToken}`,
                            Accept: 'application/json',
                        },
                    });
                    */
                    // 🔹 Maak batch requests
                    const requests = batch.map((id, idx) => ({
                        id: `${idx}`,
                        method: 'GET',
                        url: `/deviceManagement/managedDevices/${encodeURIComponent(id)}?$select=id,ownerType,serialNumber,deviceName,operatingSystem,usersLoggedOn,lastSyncDateTime,enrolledDateTime,complianceState,userPrincipalName`,
                    }));

                    const response = await fetch('https://graph.microsoft.com/beta/$batch', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${graphToken}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                        body: JSON.stringify({ requests }),
                    });

                    console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Status for ID ${id}: ${response.status}`);

                    if (!response.ok) {
                        let errorText;
                        try {
                            const errDetails = await response.json();
                            errorText = JSON.stringify(errDetails, null, 2);
                        } catch {
                            errorText = await response.text();
                        }
                        console.error(`[${moduleName}][${functionName}] Batch request failed: ${errorText}`);
                        throw new Error(errorText);
                    }

                    const data = await response.json();
                    data.responses.forEach(res => {
                        if (res.status >= 200 && res.status < 300) {
                            results.push(res.body);
                            console.info(`[${moduleName}][${functionName}] Retrieved device ${res.body.id}`);
                        } else {
                            console.error(`[${moduleName}][${functionName}] Error fetching device ${res.id}: Status ${res.status}`);
                        }
                    });
                }
            } else {
                // 🔹 Existing logic for serialNumber or other fields
                const filterSerials = batch.map(sn => `${fieldName} eq '${sn}'`).join(' or ');
                let filterQuery = filterSerials;
                if (extraFilter) {
                    filterQuery = `(${filterSerials}) and (${extraFilter})`;
                }

                let nextLink = `${baseUrl}?$filter=${encodeURIComponent(filterQuery)}&$select=id,ownerType,serialNumber,deviceName,operatingSystem,usersLoggedOn,lastSyncDateTime,enrolledDateTime,complianceState,userPrincipalName`;

                while (nextLink) {
                    const response = await fetch(nextLink, {
                        headers: {
                            Authorization: `Bearer ${graphToken}`,
                            Accept: 'application/json',
                        },
                    });

                    console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Status: ${response.status}`);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.value?.length) {
                            results.push(...data.value);
                            console.info(`[${moduleName}][${functionName}] [Batch ${index + 1}] Received ${data.value.length} devices`);
                        }
                        nextLink = data['@odata.nextLink'] || null;
                    } else {
                        let errorText;
                        try {
                            const errorDetails = await response.json();
                            errorText = JSON.stringify(errorDetails, null, 2);
                        } catch {
                            errorText = await response.text();
                        }
                        console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                        throw new Error(errorText);
                    }
                }
            }

            return results;
        });

        const allResults = await Promise.all(fetchPromises);
        allResults.forEach(batchDevices => output.push(...batchDevices));

        console.log(`[${moduleName}][${functionName}] Request successful`);
        console.log(`[${moduleName}][${functionName}] ${output.length} items fetched`);
        return output;

    } catch (err) {
        console.error(`[${moduleName}][${functionName}] ❌ Error: ${err.message}`);
        throw err;
    }
}




export async function fetchUserBatch(graphToken, userIdsBatch) {
    const functionName = 'fetchUserBatch';
    const endpoint = 'https://graph.microsoft.com/v1.0/$batch';



    try {
        // Start timer
        //console.time(functionName);
        console.info(`[${moduleName}][${functionName}] Sending batch request with ${userIdsBatch.length} users`);

        const requests = userIdsBatch.map((userId, index) => ({
            id: `${index}`,
            method: 'GET',
            url: `/users/${userId}?$select=userPrincipalName,onPremisesSamAccountName,onPremisesSecurityIdentifier,id,mail`,
        }));

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${graphToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ requests }),
        });

        console.info(`[${moduleName}][${functionName}] Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();

            //console.timeEnd(functionName);
            //console.timeLog(functionName);
            console.info(`[${moduleName}][${functionName}] Batch request successful`);
            return data;
        }

        if (response.status >= 400 && response.status < 500) {
            //console.timeEnd(functionName);
            let errorText;
            try {
                const errorDetails = await response.json();
                errorText = JSON.stringify(errorDetails, null, 2);
            } catch {
                errorText = await response.text();
            }

            switch (response.status) {
                case 401:
                    console.error(`[${moduleName}][${functionName}] Unauthorized (401): ${errorText}`);
                    throw new Error(`Unauthorized (401): ${errorText}`);
                case 403:
                    console.error(`[${moduleName}][${functionName}] Forbidden (403): ${errorText}`);
                    throw new Error(`Forbidden (403): ${errorText}`);
                default:
                    console.error(`[${moduleName}][${functionName}] Client error ${response.status}: ${errorText}`);
                    throw new Error(`Client error ${response.status}: ${errorText}`);
            }

        }

        if (response.status >= 500) {
            console.error(`[${moduleName}][${functionName}] Server error ${response.status}: ${response.statusText}`);
            throw new Error(`Server error ${response.status}: ${response.statusText}`);
        }

        console.error(`[${moduleName}][${functionName}] Unexpected response status: ${response.status}`);
        throw new Error(`Unexpected response status: ${response.status}`);


    } catch (error) {
        console.error(`[${moduleName}][${functionName}] Error: ${error.message}`);
        throw error;
    }
}