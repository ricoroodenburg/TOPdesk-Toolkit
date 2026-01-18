export const step1 = {
  title: "Let's get started",
  render: (container, data, wizardState) => {
    container.innerHTML = `
        <div style="min-width: 85vh; max-width: 100vh; margin: 0 auto; text-align: center;">
            <h1>{t('welcomePage.header')}</h1>
            <p>{t('welcomePage.message')}</p>

            <!-- Features kopje -->
            <h2 style="margin-top: 40, margin-bottom: 24, font-weight: '600', font-size: '1.5rem'">
            Features
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 40, textAlign: 'left', rowGap: 16, }} >
            {leftFeatures.map((feature, i) => (
                <React.Fragment key={i}>
                <FeatureItem text={feature} />
                <FeatureItem text={rightFeatures[i]} />
                </React.Fragment>
            ))}
            </div>
        </div>
    `;
// Next knop meteen beschikbaar
    wizardState.stepsValid[0] = true;
    // updateButtons moet ook via wizardState (of via een helper)
    if (typeof updateButtons === 'function') updateButtons();
  }
};