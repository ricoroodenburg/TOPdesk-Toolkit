export function signInWithTopdesk(url, clientId) {
    const state = crypto.randomUUID();

    sessionStorage.setItem('topdesk_oauth_state', state);
    sessionStorage.setItem('topdesk_oauth_url', url);

    const redirectUri =
        `${window.location.origin}/oauth/callback.html`;

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        state
    });

    const oauthUrl =
        `${url}/services/oauth/authorize?${params.toString()}`;
    console.log(oauthUrl);
    const popup = window.open(
        oauthUrl,
        'TOPdesk Authentication',
        'width=600,height=700'
    );

    if (!popup) {
        throw new Error(
            'The TOPdesk login popup was blocked by your browser.'
        );
    }

    return popup;
}