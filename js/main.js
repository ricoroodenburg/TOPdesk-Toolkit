document.addEventListener('DOMContentLoaded', () => {

  // ---------------------
  // PAGE LOADER
  // ---------------------
  const pathToTool = {
    '': 'startpage',
    'releasenotes': 'release-notes',
    'assetaudit': 'asset-audit'
  };

  const iframe = document.getElementById('tool-frame');
  const sidebar = document.getElementById('sidebar');

  const loadPage = (toolName) => {
    if (!toolName) return;

    iframe.src = `tools/${toolName}/index.html`;

    document.querySelectorAll('.sidebar-item')
      .forEach(el => el.classList.remove('active'));

    const activeItem = document.querySelector(`.sidebar-item[data-tool="${toolName}"]`);
    if (activeItem) activeItem.classList.add('active');
  };

  // Load initial page from hash
  const hash = window.location.hash.substring(1);
  const initialTool = pathToTool[hash] || 'startpage';
  loadPage(initialTool);

  // Sidebar navigation click
  sidebar.addEventListener('click', event => {
    const item = event.target.closest('.sidebar-item');
    if (!item) return;

    event.preventDefault();
    const toolName = item.dataset.tool;
    loadPage(toolName);

    const reverseMapping = {
      'startpage': '',
      'release-notes': 'releasenotes',
      'asset-audit': 'assetaudit'
    };

    window.location.hash = reverseMapping[toolName];
  });

  // ---------------------
  // SIDEBAR COLLAPSE BUTTON
  // ---------------------
  const toggleButton = document.getElementById('toggleButton');
  const icon = toggleButton.querySelector('.e-icons');  // <-- correct

  let isCollapsed = false;

  toggleButton.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    sidebar.classList.toggle('collapsed', isCollapsed);
    icon.classList.toggle('e-chevron-left-small', !isCollapsed);
    icon.classList.toggle('e-chevron-right-small', isCollapsed);
  });

  // ---------------------
  // ABOUT BUTTON POPUP
  // ---------------------
  const btn = document.querySelector("#btAbout");
  if (btn) {
    btn.addEventListener("click", () => {
      showPopup(`${t('terms.about')} ${t('header.title')}`, `${t('terms.aboutMessage')}`);
    });
  }

});