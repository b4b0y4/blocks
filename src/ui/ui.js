// Main UI orchestration module.
// This module acts as the "view" layer of the application and coordinates
// all UI operations by delegating to specialized modules.

import { contractRegistry, is } from "../config/contracts.js";
import { libs, curated } from "../config/genArtRef.js";
import { dom, panels, setupEventListeners } from "./dom.js";
import * as theme from "./theme.js";
import * as tooltips from "./tooltips.js";
import * as listViews from "./lists-viewer.js";
import * as frame from "./frame.js";

// Modules are injected from the main script.js to avoid circular dependencies.
let state, eth;
export function init(stateModule, ethModule) {
  state = stateModule;
  eth = ethModule;
}

// --- UI UTILS  ---

// Shortens a long token ID for cleaner display.
export function shortId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0;
}

// Shortens an Ethereum address for cleaner display (e.g., 0x123...456)
function shortAddr(address) {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4,
  )}`;
}

// Creates the "X / Y Minted" text for the info panel.
function editionTxt(edition, minted) {
  return edition - minted > 0
    ? `${minted} / ${edition} Minted`
    : `${edition} Work${edition > 1 ? "s" : ""}`;
}

// A utility to create a labeled section in the info panel.
function createSection(title, content) {
  return content
    ? `<div class="section">
         <p class="more">
           ${title} <br>
           ${content}
         </p>
       </div>`
    : "";
}

// Extracts the domain name from a URL for display.
export function extractDomain(url) {
  const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)(\/.*)?/);
  return match ? `${match[1]}${match[2] || ""}` : `${url}`;
}

// Gets the full library version string (e.g., "p5@1.4.0").
export function getLibVersion(extLib) {
  return (
    Object.keys(libs).find((key) =>
      key.startsWith(extLib.replace(/js$/, "") + "@"),
    ) || extLib
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

// --- PANEL  ---

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

export const toggleSpin = (show = true) => {
  dom.spinner.style.display = show ? "block" : "none";
};

export const updateLoopButton = (state) => {
  const loopState = state.getLoopState();
  document.querySelector("#openLoop").style.display =
    loopState.isLooping !== "true" ? "inline-block" : "none";

  document.querySelector("#stopLoop").style.display =
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

// --- INFO PANEL ---

// Determines the curation status for display based on project ID for legacy Art Blocks contracts.
function getCuration(projId) {
  const playground = [
    6, 14, 15, 16, 18, 19, 20, 22, 24, 25, 26, 30, 37, 42, 48, 56, 57, 68, 77,
    94, 104, 108, 112, 119, 121, 130, 134, 137, 139, 145, 146, 157, 163, 164,
    167, 191, 197, 200, 201, 208, 212, 217, 228, 230, 234, 248, 256, 260, 264,
    286, 289, 292, 294, 310, 319, 329, 339, 340, 350, 356, 362, 366, 369, 370,
    373,
  ];

  return curated.includes(projId)
    ? "Art Blocks Curated"
    : playground.includes(projId)
      ? "Art Blocks Playground"
      : projId < 374
        ? "Art Blocks Factory"
        : "Art Blocks Presents";
}

// Determines the platform name for display (e.g., "Art Blocks Studio").
function getPlatform(contract, projId, eth) {
  const contractName = eth.nameMap[contract];

  if (["AB", "ABII", "ABIII"].includes(contractName)) {
    return getCuration(projId);
  }
  if (is.studio.includes(contractName)) {
    return "Art Blocks Studio";
  }

  return contractRegistry[contractName].platform || "";
}

// Determines if an external dependency should be shown in the UI.
function showExtDep(dependency) {
  if (!dependency) return false;

  const isOnchain = dependency.dependency_type === "ONCHAIN";
  const isArtBlocksRegistry =
    dependency.dependency_type === "ART_BLOCKS_DEPENDENCY_REGISTRY";

  return !isOnchain && !isArtBlocksRegistry;
}

// Determines the type of an external dependency for display.
function getExtDepType(dependency, contract, eth) {
  if (eth.nameMap[contract] === "BMFLEX") {
    return "ipfs";
  }

  const isIPFS =
    dependency.dependency_type === "IPFS" ||
    (dependency.cid &&
      (dependency.cid.startsWith("Qm") || dependency.cid.startsWith("baf")));

  return isIPFS ? "ipfs" : "arweave";
}

// Populates the main info panel with all the artwork details.
function updateInfo(
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
) {
  let artist = detail[1] || "Snowfro";
  const logs = [];

  // This inner function is used to update the display if the artist name is found asynchronously.
  const updateDisplay = () => {
    dom.info.innerHTML = `${detail[0]} #${shortId(tokenId)} / ${artist}`;
    dom.panel.innerHTML = `
       <div class="work">${detail[0]}</div>
       <p>
         <span class="artist">${artist}${platform ? ` ● ${platform}` : ""}</span><br>
         <span class="edition">${editionTxt(edition, minted)}</span>
       </p>
       <p>${detail[2]}</p>
       <div class="column-box">
         <div class="column">
           ${
             owner
               ? createSection(
                   "OWNER",
                   `<a href="https://zapper.xyz/account/${owner}" target="_blank">
               ${ensName || shortAddr(owner)}
             </a>
             <span class="copy-txt" data-text="${owner}">
               <i class="fa-regular fa-copy"></i>
             </span>`,
                 )
               : ""
           }
           ${createSection(
             "CONTRACT",
             `<a href="https://etherscan.io/address/${
               eth.instance[contract].target
             }" target="_blank">
               ${shortAddr(eth.instance[contract].target)}
             </a>
             <span class="copy-txt" data-text="${eth.instance[contract].target}">
               <i class="fa-regular fa-copy"></i>
             </span>`,
           )}
           ${createSection(
             "TOKEN ID",
             `<span class="copy-txt" data-text="${tokenId}">
               ${tokenId} <i class="fa-regular fa-copy"></i>
             </span>`,
           )}
         </div>
         <div class="column">
           ${
             detail[3]
               ? createSection(
                   "ARTIST WEBSITE",
                   `<a href="${detail[3]}" target="_blank">
                   ${extractDomain(detail[3])}
                 </a>`,
                 )
               : ""
           }
           ${
             extLib &&
             !extLib.startsWith("js") &&
             !extLib.startsWith("svg") &&
             !extLib.startsWith("custom")
               ? createSection(
                   "LIBRARY",
                   `<span class="no-copy-txt">
                   ${getLibVersion(extLib)} <br>
                   ${extDep.length > 0 && extDep[0].cid && extDep[0].cid.length < 10 ? extDep[0].cid : ""}
                 </span>`,
                 )
               : ""
           }
           ${
             (extDep.length > 0 && showExtDep(extDep[0])) ||
             eth.nameMap[contract] === "BMFLEX"
               ? createSection(
                   "EXTERNAL DEPENDENCY",
                   `<span class="no-copy-txt">
                     ${getExtDepType(extDep[0], contract, eth)}
                   </span>`,
                 )
               : ""
           }
           ${
             detail[4]
               ? createSection(
                   "LICENSE",
                   `<span class="no-copy-txt">${detail[4]}</span>`,
                 )
               : ""
           }
         </div>
       </div>
     `;

    // Adds click-to-copy functionality to the relevant fields.
    dom.panel.addEventListener("click", (e) => {
      const copyBtn = e.target.closest(".copy-txt");
      if (copyBtn) {
        const textToCopy = copyBtn.getAttribute("data-text");
        copyToClipboard(textToCopy);

        const icon = copyBtn.querySelector("i");
        icon.classList.replace("fa-regular", "fa-solid");
        icon.classList.replace("fa-copy", "fa-check");

        setTimeout(() => {
          icon.classList.replace("fa-solid", "fa-regular");
          icon.classList.replace("fa-check", "fa-copy");
        }, 1000);
      }
    });
  };

  // Some contracts log the artist name to the console; this captures it.
  dom.frame.contentWindow.console.log = (message) => {
    if (eth.nameMap[contract] === "BMF" && !logs.length) {
      artist = message
        .replace(/Artist\\s*\\d+\\.\s*/, "")
        .replace(/\\s*--.*/, "");
      logs.push(artist);
      updateDisplay();
    }
  };

  updateDisplay();
}

// --- UI ---

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
  const uiCallbacks = {
    setDisplay: (skipOverlay) => setDisplay(state, skipOverlay),
    toggleSpin,
    clearPanels,
    togglePanel,
    update,
    ...actionCallbacks,
  };
  listViews.init(state, uiCallbacks, dom);

  // Setup all event listeners
  setupEventListeners(state, actionCallbacks);

  // Set initial UI state on page load.
  updateLoopButton(state);
  setDisplay(state);
  dom.root.classList.remove("no-flash");
}
