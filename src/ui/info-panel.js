// Info panel rendering module.
// Handles the creation and updating of the main artwork information display.

import { contractRegistry, is } from "../config/contracts.js";
import {
  shortId,
  shortAddr,
  editionTxt,
  createSection,
  extractDomain,
  getLibVersion,
  copyToClipboard,
} from "./ui-utils.js";
import { dom } from "./dom.js";

// Determines the curation status for display based on project ID for legacy Art Blocks contracts.
function getCuration(projId, state) {
  const playground = [
    6, 14, 15, 16, 18, 19, 20, 22, 24, 25, 26, 30, 37, 42, 48, 56, 57, 68, 77,
    94, 104, 108, 112, 119, 121, 130, 134, 137, 139, 145, 146, 157, 163, 164,
    167, 191, 197, 200, 201, 208, 212, 217, 228, 230, 234, 248, 256, 260, 264,
    286, 289, 292, 294, 310, 319, 329, 339, 340, 350, 356, 362, 366, 369, 370,
    373,
  ];

  return state.curated.includes(projId)
    ? "Art Blocks Curated"
    : playground.includes(projId)
      ? "Art Blocks Playground"
      : projId < 374
        ? "Art Blocks Factory"
        : "Art Blocks Presents";
}

// Determines the platform name for display (e.g., "Art Blocks Studio").
export function getPlatform(contract, projId, eth, state) {
  const contractName = eth.nameMap[contract];

  if (["AB", "ABII", "ABIII"].includes(contractName)) {
    return getCuration(projId, state);
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
export function updateInfo(
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
        .replace(/Artist\\s*\\d+\\.\\s*/, "")
        .replace(/\\s*--.*/, "");
      logs.push(artist);
      updateDisplay();
    }
  };

  updateDisplay();
}
