window.i18nReady.then(() => {
	const defaultMoreItems = [
		{ text: 'My Topdesk', url: 'https://my.topdesk.com', iconCss: 'e-icons e-open-link' },
		{ text: 'Community', url: 'https://community.topdesk.com', iconCss: 'e-icons e-open-link' },
		{ separator: true },
		{ text: 'Documentation portal', url: 'https://docs.topdesk.com', iconCss: 'e-icons e-open-link' },
		{ text: 'API Documentation', url: 'https://developers.topdesk.com', iconCss: 'e-icons e-open-link' },
		{ separator: true },
		{ text: t('terms.statusPage'), url: 'https://status.topdesk.com', iconCss: 'e-icons e-open-link' },
		{ text: 'Roadmap', url: 'https://tip.topdesk.com', iconCss: 'e-icons e-open-link' },
		{ separator: true },
		{ text: t('terms.about'), id: "openDialogBtn", iconCss: 'e-icons e-circle-info' }
	];

	const moreBtn = new ej.splitbuttons.DropDownButton({
		items: defaultMoreItems,
		content: t('terms.more'),
		beforeItemRender: (args) => {
			const a = args.element.getElementsByTagName('a')[0];
			if (a && args.item.url) {
				a.setAttribute('target', '_blank');
			}
		},
		select: function (args) {
			if (args.item.id === "openDialogBtn") {
				if (window.dialog) {
					window.dialog.show();
				}
			}
		},
		animationSettings: { effect: 'SlideDown', duration: 800, easing: 'ease' }
	});
	moreBtn.appendTo("#moreBtn");

	function updateToolbar() {
		if (window.innerWidth <= 600) {
			moreBtn.content = null;
		} else {
			moreBtn.items = defaultMoreItems;
			moreBtn.content = t('terms.more');
		}
		moreBtn.dataBind();
	}

	window.addEventListener("resize", updateToolbar);
	updateToolbar();

});