// DOM element references and event handling module.
// Centralizes all DOM queries and event listener registrations.

import { clearPanels, togglePanel } from "./ui.js";
import * as listViews from "./list-views.js";

export const dom = {
  root: document.documentElement,
  instruction: document.querySelector(".instruction"),
  rpcUrlInput: document.getElementById("rpcUrl"),
  themeBtns: document.querySelectorAll(".theme-button"),
  settings: document.getElementById("settings"),
  frame: document.getElementById("frame"),
  infobar: document.querySelector(".infobar"),
  info: document.getElementById("info"),
  save: document.getElementById("saveBtn"),
  dec: document.getElementById("decrementBtn"),
  inc: document.getElementById("incrementBtn"),
  explore: document.getElementById("explore"),
  loop: document.getElementById("loop"),
  openLoop: document.getElementById("openLoop"),
  dropMenu: document.getElementById("dropMenu"),
  allLoop: document.getElementById("loopAll"),
  favLoop: document.getElementById("favLoop"),
  curatedLoop: document.getElementById("curatedLoop"),
  selectedLoop: document.getElementById("selectedLoop"),
  oobLoop: document.getElementById("oobLoop"),
  stopLoop: document.getElementById("stopLoop"),
  loopInput: document.getElementById("loopInput"),
  randomButton: document.getElementById("randomButton"),
  searchBox: document.querySelector(".search-box"),
  search: document.getElementById("searchInput"),
  searchIcon: document.getElementById("searchIcon"),
  favIcon: document.getElementById("favIcon"),
  spinner: document.querySelector(".spinner"),
  panel: document.querySelector(".panel"),
  listPanel: document.querySelector(".list-panel"),
  favPanel: document.querySelector(".fav-panel"),
  overlay: document.querySelector(".overlay"),
  tooltip: document.querySelector(".tooltip"),
};

// List of all panels that can be toggled, used for easy state management.
export const panels = [
  dom.instruction,
  dom.panel,
  dom.listPanel,
  dom.favPanel,
  dom.dropMenu,
];

// Sets up all event listeners for the application.
export function setupEventListeners(state, actionCallbacks) {
  // RPC URL input handler
  dom.rpcUrlInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const value = dom.rpcUrlInput.value.trim();
      state.setRpcUrl(value === "" ? null : value);
      location.reload();
    }
  });

  // Search input handler
  dom.search.addEventListener("input", (event) => {
    const query = event.target.value.trim().split("#")[0].trim();
    if (query !== "") {
      listViews.displayList(state.listManager.filterByQuery(query));
      if (!dom.listPanel.classList.contains("active")) {
        togglePanel(dom.listPanel);
      }
    } else {
      clearPanels();
    }
  });

  // Search keyboard navigation
  dom.search.addEventListener("keydown", listViews.handleKeyboardNavigation);

  // Settings button handler
  dom.settings.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePanel(dom.instruction);
  });

  // Info button handler
  dom.info.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePanel(dom.panel);
  });

  // Search icon handler
  dom.searchIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    listViews.displayList(state.listManager.originalList);
    togglePanel(dom.listPanel);
  });

  // Favorites icon handler
  dom.favIcon.addEventListener("click", (event) => {
    event.stopPropagation();
    listViews.displayFavoriteList();
    togglePanel(dom.favPanel);
  });

  // Repeat icon handler
  dom.openLoop.addEventListener("click", (event) => {
    event.stopPropagation();
    togglePanel(dom.dropMenu);
  });

  // Panel click handlers (prevent event bubbling)
  panels.forEach((panel) => {
    panel.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });

  // Global click handler to close panels
  document.addEventListener("click", clearPanels);
}
