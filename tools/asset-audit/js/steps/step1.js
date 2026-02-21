export const step1 = {
    render: (container, data, wizardState) => {
        container.innerHTML = `
        <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto; text-align: center;">
            <div style="text-align: center;">
                <h1 class="step-title"></h1>
                <p class="step-message"></p>
            </div>

            <h2 style="margin-top: 40px; margin-bottom: 24px; font-weight: 600; font-size: 1.5rem;">
                Features
            </h2>

            <div class="feature-grid" style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; row-gap: 16px; text-align: left;">
            </div>
        </div>
        `;

        // Next knop meteen beschikbaar
        wizardState.stepsValid[0] = true;
        if (typeof updateButtons === 'function') updateButtons();

        const grid = container.querySelector('.feature-grid');

        // --- placeholders maken: 9 features × 2 kolommen = 18 divs
        for (let i = 0; i < 4; i++) {
            grid.appendChild(createFeatureItem('')); // links
            grid.appendChild(createFeatureItem('')); // rechts
        }

        // --- vul teksten zodra i18n klaar is
        window.i18nReady.then(() => {
            const features = [
                t('welcomePage.feature1'),
                t('welcomePage.feature2'),
                t('welcomePage.feature3'),
                t('welcomePage.feature4'),
                t('welcomePage.feature5'),
               // t('welcomePage.feature6'),
                t('welcomePage.feature7'),
                t('welcomePage.feature8'),
                t('welcomePage.feature9')
            ];

            const leftFeatures = features.slice(0, Math.ceil(features.length / 2));
            const rightFeatures = features.slice(Math.ceil(features.length / 2));

            while (leftFeatures.length < rightFeatures.length) leftFeatures.push('');
            while (rightFeatures.length < leftFeatures.length) rightFeatures.push('');

            const gridItems = grid.children;
            for (let i = 0; i < leftFeatures.length; i++) {
                gridItems[i * 2].querySelector('span:last-child').textContent = leftFeatures[i];
                gridItems[i * 2 + 1].querySelector('span:last-child').textContent = rightFeatures[i];
            }

            // header & message
            const titleEl = container.querySelector('.step-title');
            const descEl = container.querySelector('.step-message');
            if (titleEl) titleEl.textContent = t('welcomePage.header');
            if (descEl) descEl.textContent = t('welcomePage.message');
        });
    }
};

function createFeatureItem(text) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.minHeight = '36px';

    const icon = document.createElement('span');
    icon.className = 'e-icons e-check';
    icon.style.color = '#4caf50';
    icon.style.marginRight = '12px';
    icon.style.lineHeight = '1';

    const spanText = document.createElement('span');
    spanText.textContent = text || ''; // altijd een span, zelfs leeg

    container.appendChild(icon);
    container.appendChild(spanText);

    return container;
}