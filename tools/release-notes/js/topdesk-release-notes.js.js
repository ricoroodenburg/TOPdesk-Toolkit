async function loadData() {
	try {
		const res = await fetch("https://topdesk-release-notes.r-roodenburg.workers.dev/");
		const json = await res.json();
		return json.notes.map(n => ({ ...n, releaseDate: new Date(n.releaseDate) }));
	} catch(e) {
		console.error("Failed to load data", e);
		return [];
	}
}