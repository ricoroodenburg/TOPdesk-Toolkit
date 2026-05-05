document.addEventListener('DOMContentLoaded', () => {

  const pathToTool = {
    '': 'startpage',
    'releasenotes': 'release-notes',
    'assetaudit': 'asset-audit'
  };

  const iframe = document.getElementById('tool-frame');
  const sidenav = document.getElementById('sidebar');

  const loadPage = (toolName) => {
    if (!toolName) return;
    iframe.src = `tools/${toolName}/index.html`;

    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.sidebar-item[data-tool="${toolName}"]`);
    if (activeItem) activeItem.classList.add('active');
  };

  // Check hash in URL bij load
  const hash = window.location.hash.substr(1); // verwijder #
  const initialTool = pathToTool[hash] || 'startpage';
  loadPage(initialTool);

  // Sidenav click
  sidenav.addEventListener('click', event => {
    const item = event.target.closest('.sidebar-item');
    if (!item) return;

    event.preventDefault();
    const toolName = item.dataset.tool;
    loadPage(toolName);

    // Update hash voor bookmark / refresh
    const reverseMapping = {
      'startpage': '',
      'release-notes': 'releasenotes',
      'asset-audit': 'assetaudit'
    };
    const newHash = reverseMapping[toolName];
    window.location.hash = newHash;
  });

});


  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('toggleButton');
const icon = toggleButton.querySelector('e-icons');  
//const icon = toggleButton.querySelector('.e-icons');

  let isCollapsed = false;

  toggleButton.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    sidebar.classList.toggle('collapsed', isCollapsed);

    if (isCollapsed) {
      icon.classList.remove('e-chevron-left-small');
      icon.classList.add('e-chevron-right-small');
    } else {
      icon.classList.remove('e-chevron-right-small');
      icon.classList.add('e-chevron-left-small');
    }
  });

  document.addEventListener("DOMContentLoaded", () => {

    const btn = document.querySelector("#btAbout");
    btn.addEventListener("click", () => {
      showPopup(`${t('terms.about')} ${t('header.title')}`, `${t('terms.aboutMessage')}`), '';
    });

  });
