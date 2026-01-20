/*
import { state } from './components/state.js';
import { topdeskPopupHTML, setupTopdeskPopup } from './topdeskSignInPopup.js';

const btnSignInTopdesk = document.querySelector("#btnSignInTopdesk");

btnSignInTopdesk.addEventListener("click", () => {
  const auth = state.topdesk?.authentication || {};

  // 1. Render de popup
  showPopup(
    `${t('terms.about')} ${t('header.title')}`,
    topdeskPopupHTML(auth),
    null, // action button wordt gekoppeld in setupTopdeskPopup
    { showClose: false } // optional
  );

  // 2. Voeg event listener toe op de action button
  setupTopdeskPopup();
});

*/