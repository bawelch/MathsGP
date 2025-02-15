/***************************************************************
 * choiceButtons.js
 * 
 * Manages dynamic buttons and text updates in the UI.
 ***************************************************************/

// Store dynamic buttons (up to P)
const P = 5;
let buttons = [];

/**
 * Updates the textboxes inside the main container.
 */
export function updateChoiceButton() {
    document.getElementById("textbox1").textContent = "Updated 1";
    document.getElementById("textbox2").textContent = "Updated 2";
    document.getElementById("textbox3").textContent = "Updated 3";
}

/**
 * Creates a dynamic button, up to P total.
 */
export function createDynamicButton(label, x, y, isActive = true) {
    if (buttons.length >= P) {
        console.warn("Max buttons reached.");
        return;
    }

    const btn = document.createElement("button");
    btn.textContent = label;
    btn.classList.add("dynamic-btn");
    if (!isActive) {
        btn.classList.add("disabled");
        btn.disabled = true;
    }

    btn.style.position = "absolute";
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.padding = "5px 10px";
    btn.style.backgroundColor = "green";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => {
        if (!btn.classList.contains("disabled")) {
            alert(`Button ${label} clicked!`);
        }
    });

    document.body.appendChild(btn);
    buttons.push(btn);
}

/**
 * Toggles the activation state of a button.
 */
export function toggleButton(index, isActive) {
    if (index < 0 || index >= buttons.length) return;
    const btn = buttons[index];
    if (isActive) {
        btn.classList.remove("disabled");
        btn.disabled = false;
    } else {
        btn.classList.add("disabled");
        btn.disabled = true;
    }
}

/**
 * Repositions an existing button.
 */
export function repositionButton(index, x, y) {
    if (index < 0 || index >= buttons.length) return;
    const btn = buttons[index];
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
}
