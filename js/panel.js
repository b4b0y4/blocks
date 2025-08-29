// Panel state management module.
// Handles visibility, toggling, and state management for all UI panels.

import { dom, panels } from "./dom-events.js";

// Hides all panels and the overlay.
export const clearPanels = () => {
  [dom.overlay, dom.infobar, ...panels].forEach((el) =>
    el.classList.remove("active"),
  );
};

// Toggles the visibility of a specific panel.
export const togglePanel = (panelElement) => {
  panels.forEach((p) =>
    p !== panelElement ? p.classList.remove("active") : (p.scrollTop = 0),
  );

  const isActive = panelElement.classList.toggle("active");
  [dom.overlay, dom.infobar].forEach((el) =>
    el.classList.toggle("active", isActive),
  );
};

// Shows or hides the main loading spinner.
export const toggleSpin = (show = true) => {
  dom.spinner.style.display = show ? "block" : "none";
};

// Updates the loop button icon to show play or stop.
export const updateLoopButton = (state) => {
  const loopState = state.getLoopState();
  document.querySelector(".fa-repeat").style.display =
    loopState.isLooping !== "true" ? "inline-block" : "none";

  document.querySelector(".fa-circle-stop").style.display =
    loopState.isLooping === "true" ? "inline-block" : "none";
};

// Sets the visibility of all major UI controls based on the current application state.
export const setDisplay = (state, skipOverlay = false) => {
  const hasContract = !!state.getContractData();
  const hasRPC = !!state.getRpcUrl();
  const hasFavorites = Object.keys(state.getFavorite()).length > 0;

  dom.infobar.style.opacity = !hasRPC || !hasContract ? "0.98" : "";

  [dom.inc, dom.dec, dom.save, dom.info, dom.explore, dom.loop].forEach(
    (button) => (button.style.display = hasContract ? "block" : "none"),
  );

  const showInstruction = !hasRPC;
  dom.instruction.classList.toggle("active", showInstruction);
  if (!skipOverlay) dom.overlay.classList.toggle("active", showInstruction);

  dom.favIcon.style.display = hasFavorites ? "block" : "none";
  dom.searchBox.classList.toggle("nofav", !hasFavorites);
  if (!hasFavorites) clearPanels();
};
