import { step1 } from './steps/step1.js';
import { step2 } from './steps/step2.js';
import { step3 } from './steps/step3.js';
import { step4 } from './steps/step4.js';
import { step5 } from './steps/step5.js';
import { step6 } from './steps/step6.js';
import { step7 } from './steps/step7.js';
import { step8 } from './steps/step8.js';

// CENTRAL WIZARD STATE
const wizardState = {
    currentStep: 0,
    steps: [step1, step2, step3, step4, step5, step6, step7, { ...step8, hidden: true }],
    stepsData: [],
    stepsValid: []
};

// INIT FUNCTION
window.addEventListener('DOMContentLoaded', () => {
    // Dynamisch stepsData & stepsValid opvullen
    wizardState.stepsData = wizardState.steps.map(() => ({}));
    wizardState.stepsValid = wizardState.steps.map(() => false);

    renderStepList();
    loadStep(wizardState.currentStep);
    updateButtons();

    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    //document.getElementById('collapseStepper').addEventListener('click', toggleStepper);
});

// STEP NAVIGATION
function loadStep(index) {
    const stepContainer = document.getElementById('stepContainer');
    stepContainer.innerHTML = '';

    // Geef wizardState én updateButtons door
    wizardState.steps[index].render(
        stepContainer,
        wizardState.stepsData[index],
        wizardState,
        updateButtons
    );

    highlightStep(index);
}


function nextStep() {
    if (wizardState.stepsValid[wizardState.currentStep]) {
        wizardState.currentStep++;
        loadStep(wizardState.currentStep);
        updateButtons();
    }
}

function prevStep() {
    if (wizardState.currentStep > 0) {
        wizardState.currentStep--;
        loadStep(wizardState.currentStep);
        updateButtons();
    }
}

// UPDATE BUTTON STATES
function updateButtons() {

    if (!wizardState.stepsValid[wizardState.currentStep]) {
        for (let i = wizardState.currentStep + 1; i < wizardState.stepsValid.length; i++) {
            wizardState.stepsValid[i] = false;
        }
    }

    document.getElementById('prevBtn').disabled = wizardState.currentStep === 0;
    document.getElementById('nextBtn').disabled = !wizardState.stepsValid[wizardState.currentStep];

    // Buttons
    prevBtn.disabled = wizardState.currentStep === 0;
    nextBtn.disabled = !wizardState.stepsValid[wizardState.currentStep];

    prevBtn.style.visibility = wizardState.currentStep === 0 ? "hidden" : "visible";
    nextBtn.textContent = wizardState.currentStep === 6 ? t('buttons.startAudit') : t('buttons.nextStep');;


    nextBtn.style.display = wizardState.currentStep === 7 ? "none" : "";
    document.getElementById('stepList').style.display = wizardState.currentStep === 7 ? "none" : "";

    // Highlight de stappen opnieuw op basis van stepsValid
    highlightStep(wizardState.currentStep);

    // --- LI cursors live updaten ---
    const currentStep = wizardState.currentStep;
    const currentValid = wizardState.stepsValid[wizardState.currentStep];
    const nextStepIndex = wizardState.stepsValid.findIndex((v) => !v);

    document.querySelectorAll('#stepList li').forEach((li, index) => {
        let clickable = false;
        
        if (index === currentStep) {
            clickable = true; // huidige stap altijd pointer
        } else if (wizardState.stepsValid[index]) {
            clickable = true; // voltooide eerdere stappen altijd pointer
        } else if (index === nextStepIndex && currentValid) {
            clickable = true; // volgende stap pointer **alleen als huidige geldig**
        }
        /*
        li.style.cursor = clickable ? 'pointer' : 'default';
        */
         // aria-disabled voor CSS
        li.setAttribute('aria-disabled', clickable ? 'false' : 'true');

        // alternatief: ook op bolletje zelf
        const circle = li.querySelector('.step-circle');
        if (circle) {
            circle.setAttribute('aria-disabled', clickable ? 'false' : 'true');
        }

    });

}

// STEP LIST / STEPPER
function renderStepList() {
    const stepList = document.getElementById('stepList');
    stepList.innerHTML = '';
    wizardState.steps.forEach((step, index) => {
        if (step.hidden) return;
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="step-circle">${index + 1}</div>
            <div class="step-label">${step.title || `Step ${index + 1}`}</div>
            <div class="step-desc">${step.description || ""}</div>
            <span class="step-line"></span>
        `;


        li.setAttribute("data-step-number", index + 1);

        li.addEventListener('click', () => {
            // Controleer dat **alle voorgaande stappen** geldig zijn
            const canAccess = wizardState.stepsValid.slice(0, index).every(valid => valid);
            if (index === 0 || canAccess) {

                wizardState.currentStep = index;
                loadStep(index);
                updateButtons();
            }
        });

        stepList.appendChild(li);
    });
}


function highlightStep(index) {
    
    document.querySelectorAll('#stepList li').forEach((li, i) => {
        li.classList.remove('active', 'completed', 'inactive');

        if (i === index) {
            li.classList.add('active'); // huidige stap
        }
        else if (wizardState.stepsValid[i]) {
            li.classList.add('completed'); // elke stap die valid is
        }
        else {
            li.classList.add('inactive'); // nog niet bereikt of invalid
        }
    });
    updateStepLines();
}
function updateStepLines() {
    const lis = document.querySelectorAll("#stepList li");

    lis.forEach((li, i) => {
        const line = li.querySelector(".step-line");
        if (!line) return;

        // standaard grijs
        //line.style.width = "100%";
        //line.style.background = "var(--ds-color-bg-primary-mild)";

        // check of **de stap zelf valid is**, niet alleen class
        if (wizardState.stepsValid[i]) {
            line.style.background = "var(--ds-color-bg-success-mid)";
        }
    });
}
