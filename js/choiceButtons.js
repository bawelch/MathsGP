/***************************************************************
 * choiceButtons.js
 * 
 * Manages dynamic buttons and text updates in the UI.
 ***************************************************************/

import appConfig from './config.js';
import { link, node, links, nodes, simulation,g } from './main.js';

// Store dynamic buttons (up to P)
const P = 5;
let buttons = [];

/**

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
 * @param {string} label - The text label for the button.
 * @param {number} x - The x position (in pixels).
 * @param {number} y - The y position (in pixels).
 * @param {boolean} isActive - Whether the button is enabled.
 * @param {number} width - The button width (in pixels).
 * @param {number} height - The button height (in pixels).
 * @param {function} onClickCallback - The function to execute on click.
 */
export function createDynamicButton(label, x, y, w, h, isActive = true, onClickCallback = null) {
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
    btn.style.left = `${x-w/2}px`;
    btn.style.top = `${y}px`;
    btn.style.width = `${w}px`;  // <-- Set button width
    btn.style.height = `${h}px`; // <-- Set button height
    btn.style.padding = "5px 10px";
    btn.style.backgroundColor = "green";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
     btn.style.cursor = isActive ? "pointer" : "not-allowed";

    // Add click event listener
    if (typeof onClickCallback === "function") {
        btn.addEventListener("click", onClickCallback);
    } else {
        console.warn(`Invalid onClickCallback for button "${label}". Expected function but got:`, onClickCallback);
    }

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
