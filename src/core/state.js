// This module manages the application's state, including data fetched from the blockchain,
// user preferences, and UI state. It persists data to localStorage where appropriate.

import { list } from "../config/lists.js";

// --- State Initialization ---

// Holds all data for the currently displayed artwork. Persisted to localStorage.
let contractData = JSON.parse(localStorage.getItem("contractData"));

// Stores user's favorite artworks. Persisted to localStorage.
let favorite = JSON.parse(localStorage.getItem("favorite")) || {};

// Manages the state of the artwork looping feature. Persisted to localStorage.
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000, // Default to 1 minute
  action: null,
};

// The live interval ID for the loop. This is not persisted as it's a runtime value.
let loopIntervalId = null;

// The user-provided RPC URL for connecting to the Ethereum network. Persisted to localStorage.
let rpcUrl = localStorage.getItem("rpcUrl");

// --- Getters and Setters ---

// Manages the state for the currently displayed artwork.
export function getContractData() {
  return contractData;
}
export function setContractData(data) {
  contractData = data;
  localStorage.setItem("contractData", JSON.stringify(data));
}
export function clearDataStorage() {
  localStorage.removeItem("contractData");
  localStorage.removeItem("scriptData");
  contractData = null;
}

// Manages the user's list of favorites.
export function getFavorite() {
  return favorite;
}
export function addFavorite(key, value) {
  favorite[key] = value;
  localStorage.setItem("favorite", JSON.stringify(favorite));
}
export function removeFavorite(key) {
  if (favorite.hasOwnProperty(key)) {
    delete favorite[key];
    localStorage.setItem("favorite", JSON.stringify(favorite));
  }
}

// Manages the state of the looping feature.
export function getLoopState() {
  return loopState;
}
export function setLoopState(state) {
  loopState = { ...loopState, ...state };
  const savableState = { ...loopState };
  localStorage.setItem("loopState", JSON.stringify(savableState));
}

// Manages the live interval ID for the loop.
export function getLoopIntervalId() {
  return loopIntervalId;
}
export function setLoopIntervalId(id) {
  loopIntervalId = id;
}

// Manages the RPC URL.
export function getRpcUrl() {
  return rpcUrl;
}
export function setRpcUrl(url) {
  if (url) {
    localStorage.setItem("rpcUrl", url);
  } else {
    localStorage.removeItem("rpcUrl");
  }
  rpcUrl = url;
}

// --- Constants and Classes ---

// Project IDs for official Art Blocks curated collections.
export const curated = [
  0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 17, 21, 23, 27, 28, 29, 35, 39, 40,
  41, 53, 59, 62, 64, 72, 74, 78, 89, 100, 114, 120, 129, 131, 138, 143, 147,
  159, 173, 204, 206, 209, 214, 215, 225, 232, 233, 250, 255, 261, 267, 282,
  284, 296, 304, 309, 320, 328, 333, 334, 336, 337, 341, 364, 367, 368, 376,
  379, 383, 385, 399, 406, 407, 412, 416, 417, 418, 423, 426, 428, 433, 455,
  456, 457, 462, 466, 471, 472, 482, 483, 484, 486, 487, 488, 493,
];

// Encapsulates the logic for filtering, navigating, and selecting items
// from the main list of generative art projects.
class ListManager {
  constructor(listData) {
    // The complete, unfiltered list of projects.
    this.originalList = listData.filter((line) => !line.trim().endsWith("!"));
    // The currently displayed list, which can be filtered.
    this.filteredList = listData;
    // The index of the currently selected item in the filtered list.
    this.selectedIndex = -1;
  }

  // Filters the list based on a text query or the "curated" keyword.
  filterByQuery(query) {
    query = query.toLowerCase().trim();
    this.filteredList =
      query === "curated"
        ? this.originalList.filter((line) => {
            const idMatch = line.match(/^AB(?:II|III|C)?(\d+)/);
            return (
              idMatch &&
              (curated.includes(parseInt(idMatch[1])) || line.startsWith("ABC"))
            );
          })
        : this.originalList.filter((line) =>
            line.toLowerCase().includes(query),
          );

    this.selectedIndex = -1;
    return this.filteredList;
  }

  // Navigates the selection up or down within the filtered list, wrapping around.
  navigate(direction) {
    const maxIndex = this.filteredList.length - 1;
    this.selectedIndex =
      direction === "up"
        ? this.selectedIndex <= 0
          ? maxIndex
          : this.selectedIndex - 1
        : this.selectedIndex >= maxIndex
          ? 0
          : this.selectedIndex + 1;
    return this.selectedIndex;
  }

  // Gets the currently selected item from the filtered list.
  getSelected() {
    return this.selectedIndex >= 0
      ? this.filteredList[this.selectedIndex]
      : null;
  }

  // Resets the list to its original, unfiltered state.
  reset() {
    this.filteredList = this.originalList;
    this.selectedIndex = -1;
    return this.filteredList;
  }
}

// A single, shared instance of the ListManager.
export const listManager = new ListManager(list);

// Defines the supported modes for artwork cycling.
export const loopTypes = ["all", "fav", "curated", "selected", "oob"];
