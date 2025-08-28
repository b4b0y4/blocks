// This is the main entry point for the application.
// It initializes all the core modules and orchestrates their interactions.

import * as state from "./state.js";
import * as eth from "./ethereum.js";
import * as ui from "./ui.js";
import * as actions from "./actions.js";
import "./block-fetcher.js";

// Initialize modules with their dependencies
eth.init(ui);
ui.init(state, eth);

// Initialize the new actions module with its dependencies
actions.init(state, eth, ui);

// Pass action handlers to UI initialization and set up event listeners
ui.initPage({
  getToken: actions.getToken,
  getRandom: actions.getRandom,
});

// --- Event Listeners ---
ui.dom.listPanel.addEventListener("click", (event) => {
  const listItem = event.target.closest(".list-item");
  if (listItem) {
    const index = parseInt(listItem.dataset.index);
    state.listManager.selectedIndex = index;
    const selectedItem = state.listManager.getSelected();
    if (selectedItem) {
      actions.getToken(selectedItem, "");
    }
  }
});

state.loopTypes.forEach((type) => {
  ui.dom[`${type}Loop`].addEventListener("click", () =>
    actions.handleLoop(`${type}Loop`),
  );
});

ui.dom.stopLoop.addEventListener("click", actions.stopLoop);
ui.dom.inc.addEventListener("click", actions.incrementTokenId);
ui.dom.dec.addEventListener("click", actions.decrementTokenId);
ui.dom.randomButton.addEventListener("click", () => {
  actions.getRandom(state.listManager.originalList);
});
ui.dom.explore.addEventListener("click", actions.exploreAlgo);
ui.dom.save.addEventListener("click", actions.saveOutput);

// Restore state from last session
const contractData = state.getContractData();
if (contractData) {
  ui.update(...Object.values(contractData));
}

actions.checkLoop();

// Global key listener for clearing data
document.addEventListener("keypress", (event) => {
  if (event.code === "Backslash") {
    state.clearDataStorage();
    location.reload();
  }
});
