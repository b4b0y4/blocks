// This file acts as the "controller" for the application, handling all user-initiated actions
// and orchestrating the application's state changes and UI updates.

import * as listViews from "./list-views.js";

// To avoid circular dependencies, modules are injected via the init function
// instead of using static imports.
let state, eth, ui;

// Initializes the actions module with required dependencies.
// This dependency injection pattern prevents circular import issues between modules.
export function init(stateModule, ethModule, uiModule) {
  state = stateModule;
  eth = ethModule;
  ui = uiModule;
}

// --- Loop Actions ---
// These functions manage the automatic cycling through different artwork collections.

// Performs a single action within a loop, such as fetching a random artwork
// from a specific list (all, favorites, curated, etc.).
function performAction(action, favorite) {
  if (action === "allLoop") getRandom(state.listManager.originalList);
  else if (action === "favLoop") getRandom(favorite);
  else if (action === "curatedLoop") {
    state.listManager.filterByQuery("curated");
    getRandom(state.listManager.filteredList);
  } else if (action === "selectedLoop") {
    const contractData = state.getContractData();
    let random = Math.floor(
      Math.random() * (contractData.edition + 1),
    ).toString();
    getToken(state.listManager.filteredList[0], random);
  } else if (action === "oobLoop") {
    exploreAlgo();
  }
}

// Starts a new loop that executes `performAction` at a given interval.
// It first clears any existing loop.
function loopRandom(interval, action) {
  const loopIntervalId = state.getLoopIntervalId();
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
  }

  const loopState = state.getLoopState();
  // Perform the first action immediately without waiting for the first interval.
  if (loopState.isLooping !== "true") {
    performAction(action, state.getFavorite());
  }

  const newIntervalId = setInterval(() => {
    performAction(action, state.getFavorite());
  }, interval);
  state.setLoopIntervalId(newIntervalId);

  state.setLoopState({
    isLooping: "true",
    interval,
    action,
  });
}

// Stops the currently active loop and updates the UI accordingly.
export function stopLoop() {
  const loopIntervalId = state.getLoopIntervalId();
  if (loopIntervalId) {
    clearInterval(loopIntervalId);
    state.setLoopIntervalId(null);
  }
  state.setLoopState({ isLooping: "false" });
  ui.updateLoopButton();
}

// Checks the loop state on page load and resumes the loop if it was active.
export function checkLoop() {
  const loopState = state.getLoopState();
  ui.updateLoopInputPlaceholder(`${loopState.interval / 60000} min`);

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action);
}

// Handles the user clicking on a loop button.
// It parses the interval from the input field and starts the loop.
export function handleLoop(action) {
  ui.clearPanels();
  const loopState = state.getLoopState();

  let inputValue = ui.getLoopInputValue().trim();
  const inputVal = parseInt(inputValue, 10);

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * 60000)
      ? loopState.interval
      : inputVal * 60000;

  if (!isNaN(interval) && interval > 0) {
    loopRandom(interval, action);
    ui.setLoopInputValue("");
    ui.updateLoopInputPlaceholder(`${interval / 60000} min`);
  } else {
    alert("Please enter a time in minutes.");
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    state.setLoopState({
      isLooping: "false",
      interval: interval,
      action: action,
    });
  }
  ui.updateLoopButton();
}

// --- Token Selection and Navigation ---
// These functions handle the selection and display of specific artworks,
// whether through search, random selection, or stepping through a collection.

// Main handler for fetching and displaying a token based on user input.
// It delegates to more specific handlers based on the query format.
export function getToken(line, searchQuery) {
  if (searchQuery === "curated") {
    getRandom(state.listManager.filteredList);
  } else if (/^\d+$/.test(searchQuery)) {
    handleNumericQuery(searchQuery);
  } else {
    handleOtherQuery(line, searchQuery);
  }
  ui.setSearchValue("");
  state.listManager.reset();
  listViews.displayList(state.listManager.originalList);
  ui.clearPanels();
}

// Handles a search query that is purely numeric, interpreted as a token ID
// within the currently viewed collection.
function handleNumericQuery(searchQuery) {
  const { contract, projId } = state.getContractData();
  const id = parseInt(searchQuery.match(/\s*(\d+)/)[1]);
  const tokenId =
    projId === 0
      ? id
      : Number((projId * 1000000 + id).toString().padStart(6, "0"));

  eth.grabData(tokenId, contract, true);
}

// Handles searches from the list panel or text-based searches.
// It parses project and token data from the list item text.
function handleOtherQuery(line, searchQuery) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*Work/;
  const [_, listContract, projIdStr, tokenStr] = line.match(regex);
  const projId = parseInt(projIdStr);
  const token = parseInt(tokenStr);
  const contract = eth.indexMap[listContract];
  let tokenId;

  if (searchQuery.includes("#")) {
    const searchId = parseInt(searchQuery.match(/#\s*(\d+)/)[1]);
    tokenId =
      projId === 0
        ? searchId
        : Number((projId * 1000000 + searchId).toString().padStart(6, "0"));
  } else {
    const randomToken = Math.floor(Math.random() * token);
    tokenId =
      projId === 0
        ? randomToken
        : Number((projId * 1000000 + randomToken).toString().padStart(6, "0"));
  }

  eth.grabData(tokenId, contract);
}

// Selects a random item from a given source.
// The source can be an array of collections or an object of favorites.
export function getRandom(source) {
  if (Array.isArray(source)) {
    const randomLine = source[Math.floor(Math.random() * source.length)];
    getToken(randomLine, "");
  } else if (typeof source === "object" && Object.keys(source).length > 0) {
    const randomKey =
      Object.keys(source)[
        Math.floor(Math.random() * Object.keys(source).length)
      ];
    state.clearDataStorage();
    const contractData = source[randomKey];
    state.setContractData(contractData);
    ui.update(...Object.values(contractData));
  }
}

// Generates a random hash and a token ID for "Out of Bounds" exploration.
// This allows viewing variations of an artwork that were never officially minted.
function generateRandomHashAndToken() {
  const contractData = state.getContractData();
  const randomHash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

  const base = contractData.projId * 1000000;
  const minToken = base + contractData.minted;
  const maxToken = base + 999999;

  const randomToken = Math.floor(
    Math.random() * (maxToken - minToken + 1) + minToken,
  );

  return { hash: randomHash, tokenId: randomToken };
}

// Loads a new artwork using a randomly generated hash, allowing exploration
// of the generative algorithm beyond the minted set.
export function exploreAlgo() {
  const contractData = state.getContractData();
  // Unigrids does not support this feature.
  if (contractData.detail[0] === "Unigrids") return;

  const { hash, tokenId } = generateRandomHashAndToken();

  contractData.hash = hash;
  contractData.tokenId = tokenId;
  contractData.owner = "";
  contractData.ensName = "";

  state.setContractData(contractData);

  // Update the script data in local storage to use the new hash.
  const scriptData = JSON.parse(localStorage.getItem("scriptData"));
  if (scriptData) {
    if (eth.nameMap[contractData.contract] === "AB") {
      scriptData.tokenIdHash = `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`;
    } else {
      scriptData.tokenIdHash = `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`;
    }
    localStorage.setItem("scriptData", JSON.stringify(scriptData));
  }
  ui.update(...Object.values(contractData));
}

// Loads the next token in the current collection, wrapping around to the beginning if at the end.
export function incrementTokenId() {
  const contractData = state.getContractData();
  let numericId = getId(contractData.tokenId);

  if (numericId === contractData.minted - 1) {
    numericId = 0;
  } else {
    numericId += 1;
  }

  const newTokeId = contractData.projId * 1000000 + numericId;
  eth.grabData(newTokeId, contractData.contract, true);
}

// Loads the previous token in the current collection, wrapping around to the end if at the beginning.
export function decrementTokenId() {
  const contractData = state.getContractData();
  let numericId = getId(contractData.tokenId);

  if (numericId === 0) {
    numericId = contractData.minted - 1;
  } else {
    numericId -= 1;
  }

  const newTokeId = contractData.projId * 1000000 + numericId;
  eth.grabData(newTokeId, contractData.contract, true);
}

// Extracts the numeric part of a token ID (the last 6 digits).
function getId(tokenId) {
  return tokenId % 1000000;
}

// --- General Actions ---

// Generates an HTML file of the current artwork and triggers a download.
export async function saveOutput() {
  const contractData = state.getContractData();
  const content = ui.getFrameContent();
  let id = ui.shortId(contractData.tokenId);
  const defaultName = `${contractData.detail[0].replace(
    /\s+/g,
    "-",
  )}#${id}.html`;
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = defaultName;
  document.body.appendChild(link);
  link.click();

  URL.revokeObjectURL(url);
  link.remove();
  listViews.pushFavoriteToStorage(id);
}
