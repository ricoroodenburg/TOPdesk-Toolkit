const LISTVIEW_PAGE_SIZE = 20;

window.addEventListener("load", async () => {
    const root = document.querySelector("#listview");
    const raw = await loadData();
    const processed = prepareData(raw);
    renderListView(root, processed);
});

function prepareData(data) {
    if (!Array.isArray(data)) return [];
    return data
        .map(item => ({
            title: item.title ?? "",
            description: item.description ?? "",
            descriptionHtml: item.descriptionHtml ?? "",
            release: item.release ?? "",
            releaseDate: new Date(item.releaseDate ?? 0),
            category: item.category ?? "",
            subcategory: item.subcategory ?? "",
            source: item.source ?? "",
            highlight: item.attentions?.highlight ?? false
        }))
        .sort((a, b) => b.releaseDate - a.releaseDate);
}

function trimText(text, max) {
    return text.length > max ? text.substring(0, max) : text;
}

function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return "-";
    return date.toLocaleDateString();
}

function renderListView(root, data) {
    root.innerHTML = `
        
			<div class "task-list-option">
				<input id="lv-search" class="textbox" placeholder="${t('terms.search')}..." />
				<div id="lv-list" class="task-list-option" style="overflow-y:auto; max-height:600px;"></div>
			</div>
    `;

    const listEl = root.querySelector("#lv-list");
    const searchEl = root.querySelector("#lv-search");

    let filtered = data;
    let page = 1;

    function refreshList(append = false) {
        const start = (page - 1) * LISTVIEW_PAGE_SIZE;
        const end = page * LISTVIEW_PAGE_SIZE;
        const items = filtered.slice(start, end);
        const html = items.map((item, i) => renderListItem(item, start + i)).join("");

        if (filtered.length === 0) {
            listEl.innerHTML = `
            <div class='emptyRecordTemplate' style="text-align: center;">
                <img src="emptyRecordTemplate.svg" class="e-emptyRecord" alt="No record" style="height: 88.2%; max-height: 360px">
                <br>
                <div class="no-results" style="padding:16px">
                    ${t('messages.noSearchResultFor')} "${searchEl.value}"
                    <p>${t('messages.searchTryAgain')}</p>
                </div>
            </div>
        `;
        } else if (append) {
            listEl.insertAdjacentHTML("beforeend", html);
        } else {
            listEl.innerHTML = html;
            listEl.scrollTop = 0;
        }

        const newItems = listEl.querySelectorAll(".todo-item:not([data-popup-bound])");
        newItems.forEach(div => {
            div.dataset.popupBound = "true";
            div.onclick = () => {
                const idx = parseInt(div.dataset.index, 10);
                const item = filtered[idx];
                showPopup(item?.category ?? "", item?.descriptionHtml ?? "");
            };
        });

    }

    searchEl.addEventListener("input", () => {
        const q = searchEl.value.toLowerCase().trim();

        filtered = data.filter(x =>
            (x.description ?? "").toLowerCase().includes(q) ||
            (x.category ?? "").toLowerCase().includes(q) ||
            (x.subcategory ?? "").toLowerCase().includes(q)
        );

        page = 1;
        refreshList(false);
    });

    listEl.addEventListener("scroll", () => {
        const atBottom =
            listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 20;

        if (atBottom) {
            if (page * LISTVIEW_PAGE_SIZE < filtered.length) {
                page++;
                refreshList(true);
            }
        }
    });

    refreshList(false);
}

function renderListItem(item, globalIndex) {
    const desc = item.description ?? "";

    return `
        <div class="task-list-option">
            <div class="todo-item ${item.highlight ? 'highlight' : ''}" data-index="${globalIndex}">
                <div class="left-column">
                    <div class="brief-description">
						<h4> 
							${item.category} ${item.subcategory ? `<span class="status-badge secondary" style="margin-right:5px">${item.subcategory}</span>` : ''} 
							${item.source === "production" ? `<span class="status-badge secondary" style="margin-right:5px">Feature</span>` : item.source === "api" ? `<span class="status-badge secondary" style="margin-right:5px">API</span>` : ''}
						</h4>
                    </div>
                    <div class="task-tag">
                        ${desc.replace(/<[^>]*>/g, '')}${desc.length >= 200 ? "..." : ""}
					</div>
					<div class="release-info" style="margin-top: 4px;">
						<i>${t('messages.releasedOn')} ${formatDate(item.releaseDate)} ${t('messages.inVersion')} ${item.release}</i>
					</div>
                </div>
            </div>
        </div>
    `;
}
