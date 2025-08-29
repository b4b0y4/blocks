// Main UI orchestration module.
// This module acts as the "view" layer of the application and coordinates
// all UI operations by delegating to specialized modules.

import {
  clearPanels,
  toggleSpin,
  updateLoopButton,
  setDisplay,
} from "./panel.js";
import { updateInfo, getPlatform } from "./info-panel.js";
import { dom, setupEventListeners } from "./dom-events.js";
import * as theme from "./theme.js";
import * as tooltips from "./tooltips.js";
import * as listViews from "./list-views.js";
import * as frame from "./frame.js";

// Modules are injected from the main script.js to avoid circular dependencies.
let state, eth;
export function init(stateModule, ethModule) {
  state = stateModule;
  eth = ethModule;
}

// This is the main update function, called after all data for an artwork has been fetched.
// It orchestrates the entire UI update process.
export function update(
  tokenId,
  contract,
  projId,
  hash,
  script,
  detail,
  owner,
  ensName,
  extLib,
  edition,
  minted,
  extDep,
  ipfs,
  arweave,
) {
  // Create a consolidated data object and save it to the state.
  const contractData = {
    tokenId,
    contract,
    projId,
    hash,
    script,
    detail,
    owner,
    ensName,
    extLib,
    edition,
    minted,
    extDep,
    ipfs,
    arweave,
  };
  state.setContractData(contractData);
  console.log(contractData);

  // Prepare and store the data needed for rendering the artwork in the iframe.
  frame.pushItemToLocalStorage(
    contract,
    tokenId,
    hash,
    script,
    extLib,
    extDep,
    ipfs,
    arweave,
  );

  // To ensure a clean slate for the new artwork, we replace the old iframe with a new one.
  const oldFrame = dom.frame;
  const frameContainer = oldFrame.parentNode;
  const newFrame = document.createElement("iframe");
  newFrame.id = "frame";
  newFrame.src = "about:blank";
  frameContainer.replaceChild(newFrame, oldFrame);
  dom.frame = newFrame;

  // Update the various UI components with the new data.
  const platform = getPlatform(contract, projId, eth, state);
  updateInfo(
    contract,
    owner,
    ensName,
    extLib,
    detail,
    tokenId,
    platform,
    edition,
    minted,
    extDep,
    eth,
  );

  setDisplay(state);
  frame.injectFrame();
  toggleSpin(false);
}

// --- UI Actions (to be called from actions.js) ---
export function getLoopInputValue() {
  return dom.loopInput.value;
}

export function setLoopInputValue(value) {
  dom.loopInput.value = value;
}

export function updateLoopInputPlaceholder(text) {
  dom.loopInput.placeholder = text;
}

export function setSearchValue(value) {
  dom.search.value = value;
}

export function getFrameContent() {
  return dom.frame.contentDocument.documentElement.outerHTML;
}

// --- Export panel functions for external use ---
export { clearPanels, toggleSpin, updateLoopButton, setDisplay };

// --- Initialization ---

// Main entry point for the UI, sets up all event listeners and initial states.
export function initPage(actionCallbacks) {
  const rpcUrl = state.getRpcUrl();
  rpcUrl
    ? (dom.rpcUrlInput.placeholder = rpcUrl)
    : (dom.rpcUrlInput.placeholder = "Enter RPC URL");

  // Initialize all the sub-modules.
  frame.init(state, eth, dom);
  theme.init(dom.root, dom.themeBtns);
  tooltips.init(dom);
  listViews.init(
    state,
    {
      setDisplay: (skipOverlay) => setDisplay(state, skipOverlay),
      toggleSpin,
      clearPanels,
      update,
      ...actionCallbacks,
    },
    dom,
  );

  // Setup all event listeners
  setupEventListeners(state, actionCallbacks);

  // Set initial UI state on page load.
  updateLoopButton(state);
  setDisplay(state);
  dom.root.classList.remove("no-flash");
}
