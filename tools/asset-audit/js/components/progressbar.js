function SegmentedProgressBar({ steps, currentStep, gap = 5 }) {
    const container = document.createElement("div");
    container.className = "SegmentedBar";
    container.style.gap = `${gap}px`;

    steps.forEach((step, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "SegmentWrapper";

        // ---- ICON ----
        const icon = document.createElement("div");
        icon.className = "SegmentIcon";

        if (index < currentStep) {
            icon.textContent = "✔";
        } else if (index === currentStep) {
            const spinner = document.createElement("div");
            spinner.className = "Spinner";
            icon.appendChild(spinner);
        } else {
            icon.textContent = index + 1;
        }

        icon.style.backgroundColor =
            index < currentStep
                ? "var(--ds-color-bg-success-mid)"
                : index === currentStep
                    ? "var(--ds-color-bg-primary-mild)"
                    : "var(--ds-color-bg-primary-mild)";

        icon.style.color =
            index < currentStep
                ? "var(--ds-color-bg-primary-mild)"
                : "var(--ds-color-fg-primary-default)";

        // ---- SEGMENT ----
        const segment = document.createElement("div");
        segment.className = "Segment";

        segment.style.backgroundColor =
            index < currentStep
                ? "var(--ds-color-bg-success-mid)"
                : index === currentStep
                    ? "var(--ds-color-fg-primary-default)"
                    : "var(--ds-color-bg-primary-mild)";

        // ---- LABEL ----
        const label = document.createElement("div");
        label.className = "SegmentLabel";

        if (index === currentStep) {
            const strong = document.createElement("strong");
            strong.textContent = step;
            label.appendChild(strong);
        } else {
            label.textContent = step;
        }

        wrapper.appendChild(icon);
        wrapper.appendChild(segment);
        wrapper.appendChild(label);

        container.appendChild(wrapper);
    });

    return container;
}

export default SegmentedProgressBar;
