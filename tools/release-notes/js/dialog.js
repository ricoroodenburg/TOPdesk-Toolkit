window.i18nReady.then(() => {
    window.dialog = new ej.popups.Dialog({
        header: `${t('terms.about')} ${t('header.title')}`,
        content: `
        ${t('messages.notDevelopmentBy')}
    `,
        buttons: [
            {
                click: function () {
                    window.open('https://github.com/ricoroodenburg/releasenotes-td', '_blank');
                },
                buttonModel: { content: `${t('messages.showOn')} GitHub`, isPrimary: true }
            }
        ],
        width: '400px',
        visible: false,
        isModal: true,
        overlayClick: onOverlayClick,
        showCloseIcon: true,
        animationSettings: {
            effect: 'Zoom',
            duration: 400,
            delay: 1
        }
    });

    function onOverlayClick() {
        dialog.hide();
    }

    dialog.appendTo('#dialog');

});