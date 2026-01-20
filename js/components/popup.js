function showPopup(title = "", content = "", action = null, options = { showClose: true }) {
    let popup = document.querySelector("#popup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popup";
        popup.innerHTML = `
            <div class="popup-overlay"></div>
            <div class="popup-box">
                <div class="popup-header">
                    <h2 class="popup-title"></h2>
                   <span class="popup-close">
                        <svg aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" class="modal__xmark" viewBox="0 0 384 512">
                            <path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"></path>
                        </svg>
                    </span>
                </div>
                <div class="popup-content"></div>
                <div class="popup-footer">
                    <button class="button primary popup-close-btn">${t('terms.close')}</button>
                    <button class="button secondary popup-action-btn"></button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        injectPopupStyles();
    }

    // Fill Content
    popup.querySelector(".popup-title").textContent = title;
    popup.querySelector(".popup-content").innerHTML = content;

    // X button
    const closeX = popup.querySelector(".popup-close");
    if (closeX && !closeX.dataset.bound) {
        closeX.addEventListener("click", hidePopup);
        closeX.dataset.bound = "true";
    }

    // Footer close button
    const closeBtn = popup.querySelector(".popup-close-btn");
    if (closeBtn) {
        closeBtn.style.display = options.showClose ? "visible" : "none";

        if (!closeBtn.dataset.bound && options.showClose) {
            closeBtn.addEventListener("click", hidePopup);
            closeBtn.dataset.bound = "true";
        }
    }

    // Overlay click
    const overlay = popup.querySelector(".popup-overlay");
    if (overlay && !overlay.dataset.bound) {
        overlay.addEventListener("click", hidePopup);
        overlay.dataset.bound = "true";
    }

    // ESC key
    if (!popup.dataset.escBound) {
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") hidePopup();
        });
        popup.dataset.escBound = "true";
    }

    // -------------------------------------
    // NEW: Optional Action Button
    // -------------------------------------
    const actionBtn = popup.querySelector(".popup-action-btn");

    if (action && action.label) {
        actionBtn.textContent = action.label;
        //actionBtn.style.display = "inline-block";

        // remove old handler
        const newBtn = actionBtn.cloneNode(true);
        actionBtn.replaceWith(newBtn);

        // voeg nieuwe handler toe
        newBtn.addEventListener("click", () => {
            if (typeof action.onClick === "function") {
                action.onClick();
            }
        });
    } else {
        actionBtn.style.display = "none";
    }

    // Show popup
    popup.style.display = "flex";

}

function hidePopup() {
    const popup = document.querySelector("#popup");
    if (popup) {
        popup.style.display = "none";
    }
}

function injectPopupStyles() {
    if (document.querySelector("#popup-styles")) return;

    const style = document.createElement("style");
    style.id = "popup-styles";
    style.textContent = `
        .popup-footer {
            display: flex;
            gap: 12px; /* ruimte tussen buttons */
        }
    `;

    document.head.appendChild(style);
}