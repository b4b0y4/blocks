/*---------------------------------------------------------
 *                    CORE IMPORTS & DOM
 *-------------------------------------------------------*/
import { ethers } from "./ethers.min.js";
import { list, libs } from "./lists.js";
import { contractRegistry, is } from "./contracts.js";

// fetchBlocks(["ABC", ...is.studio]);

const dom = {
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
  repeatIcon: document.getElementById("repeatIcon"),
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

const panels = [
  dom.instruction,
  dom.panel,
  dom.listPanel,
  dom.favPanel,
  dom.dropMenu,
];
const loopTypes = ["all", "fav", "curated", "selected", "oob"];

/*---------------------------------------------------------
 *                    ETHEREUM SETUP
 *-------------------------------------------------------*/
const rpcUrl = localStorage.getItem("rpcUrl");
const provider = new ethers.JsonRpcProvider(rpcUrl);

rpcUrl
  ? (dom.rpcUrlInput.placeholder = rpcUrl)
  : (dom.rpcUrlInput.placeholder = "enter rpc url");

const instance = [];
const nameMap = {};
const indexMap = {};

Object.keys(contractRegistry).forEach((key, index) => {
  const { abi, address } = contractRegistry[key];
  instance.push(new ethers.Contract(address, abi, provider));
  nameMap[index] = key;
  indexMap[key] = index;
});

/*---------------------------------------------------------
 *                   STATE MANAGEMENT
 *-------------------------------------------------------*/
let contractData = JSON.parse(localStorage.getItem("contractData"));
let favorite = JSON.parse(localStorage.getItem("favorite")) || {};
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000,
  action: null,
  intervalId: null,
};

/*---------------------------------------------------------
 *                LIST MANAGEMENT SYSTEM
 *-------------------------------------------------------*/
class ListManager {
  constructor(listData) {
    this.originalList = listData.filter((line) => !line.trim().endsWith("!"));
    this.filteredList = listData;
    this.selectedIndex = -1;
  }

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

  getSelected() {
    return this.selectedIndex >= 0
      ? this.filteredList[this.selectedIndex]
      : null;
  }

  reset() {
    this.filteredList = this.originalList;
    this.selectedIndex = -1;
    return this.filteredList;
  }
}

const listManager = new ListManager(list);

function displayList(items) {
  const listItems = items
    .map((line, index) => {
      const parts = line.split(" # ");
      const collectionAndArtist = parts[1].split(" / ");
      const collection = collectionAndArtist[0];
      const artist = collectionAndArtist[1];
      const workCount = parts[parts.length - 1];

      return `<p class="list-item ${index === listManager.selectedIndex ? "selected" : ""}"
               data-index="${index}">
               ${collection}
               <span>${artist} - ${workCount}</span>
            </p>`;
    })
    .join("");

  dom.listPanel.innerHTML = `<div>${listItems}</div>`;
}

function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const newIndex = listManager.navigate(
      event.key === "ArrowUp" ? "up" : "down",
    );
    displayList(listManager.filteredList);

    const selectedItem = dom.listPanel.querySelector(
      `[data-index="${newIndex}"]`,
    );
    selectedItem?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    const selectedItem = listManager.getSelected();
    if (selectedItem) {
      getToken(selectedItem, "");
    } else {
      const query = dom.search.value.trim();
      query === ""
        ? getRandom(listManager.originalList)
        : getToken(listManager.filteredList[0], query);
    }
  }
}

/*---------------------------------------------------------
 *                 ETHEREUM FUNCTIONS
 *-------------------------------------------------------*/
async function fetchBlocks(array) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log("%cLOOKING FOR BLOCKS...", "color: lime;");

  for (const contractName of array) {
    const n = indexMap[contractName];
    const start = contractRegistry[contractName].startProjId || 0;
    const end = Number(await instance[n].nextProjectId());
    const blocks = [];
    const BATCH = 20;

    for (let id = start; id < end; id += BATCH) {
      const batchPromises = [];

      for (let batchId = id; batchId < Math.min(id + BATCH, end); batchId++) {
        batchPromises.push(
          Promise.all([
            instance[n].projectDetails(batchId.toString()),
            is.v3.includes(contractName)
              ? instance[n].projectStateData(batchId)
              : instance[n].projectTokenInfo(batchId),
          ]).catch(() => null),
        );
      }

      const results = await Promise.all(batchPromises);

      results.forEach((result, idx) => {
        if (result) {
          const [detail, token] = result;
          const newItem = `${contractName}${id + idx} # ${detail[0]} / ${detail[1]} # ${token.invocations} ${
            Number(token.invocations) === 1 ? "Work" : "Works"
          }`;

          if (!list.map((item) => item.replace(/!$/, "")).includes(newItem)) {
            blocks.push(`"${newItem}",`);
          }
        }
      });
    }

    blocks.length > 0
      ? console.log(blocks.join("\n"))
      : console.log(`${contractName} ✅`);
  }
  console.log("%cDONE!!!", "color: lime;");
}

function checkForNewContracts() {
  const existingContracts = new Set(list.map((item) => item.split(/[0-9]/)[0]));
  const newContract = Object.keys(contractRegistry).filter(
    (key) => !existingContracts.has(key),
  );

  if (newContract.length > 0) fetchBlocks(newContract);
}

async function grabData(tokenId, contract, updateOnly = false) {
  try {
    toggleSpin();
    clearPanels();
    console.log("Contract:", contract, "\nToken Id:", tokenId);

    if (updateOnly) {
      const [hash, { owner, ensName }] = await Promise.all([
        fetchHash(tokenId, contract),
        fetchOwner(tokenId, contract),
      ]);

      const data = JSON.parse(localStorage.getItem("contractData"));
      data.tokenId = tokenId;
      data.contract = contract;
      data.hash = hash;
      data.owner = owner;
      data.ensName = ensName;

      localStorage.setItem("contractData", JSON.stringify(data));
      update(...Object.values(data));
    } else {
      clearDataStorage();

      const isV3 = is.v3.includes(nameMap[contract]);
      const [projectId, hash, { owner, ensName }] = await Promise.all([
        fetchProjectId(tokenId, contract),
        fetchHash(tokenId, contract),
        fetchOwner(tokenId, contract),
      ]);

      const projId = Number(projectId);
      const [projectInfo, detail, { edition, minted }] = await Promise.all([
        fetchProjectInfo(projId, contract, isV3),
        fetchProjectDetails(projId, contract),
        fetchEditionInfo(projId, contract, isV3),
      ]);

      const [script, extLib] = await Promise.all([
        constructScript(projId, projectInfo, contract),
        extractLibraryName(projectInfo),
      ]);

      let extDep = [];
      let ipfs = null;
      let arweave = null;

      if (is.flex.includes(nameMap[contract])) {
        const extDepCount = await fetchExtDepCount(projId, contract);
        if (extDepCount) {
          const fetchCIDsFn = isV3 ? fetchV3CIDs : fetchV2CIDs;
          [extDep, { ipfs, arweave }] = await Promise.all([
            fetchCIDsFn(projId, extDepCount, contract),
            fetchGateway(contract),
          ]);
          if (nameMap[contract] === "BMFLEX") {
            ipfs = "https://ipfs.io/ipfs";
          }
        }
      }

      const data = {
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

      localStorage.setItem("contractData", JSON.stringify(data));
      update(...Object.values(data));
    }
  } catch (error) {
    console.error(`grabData (${updateOnly ? "update" : "full"})`, error);
    toggleSpin(false);
  }
}

async function fetchHash(tokenId, contract) {
  return nameMap[contract] == "AB"
    ? instance[contract].showTokenHashes(tokenId)
    : instance[contract].tokenIdToHash(tokenId);
}

async function fetchProjectId(tokenId, contract) {
  return instance[contract].tokenIdToProjectId(tokenId);
}

async function fetchProjectInfo(projId, contract, isV3) {
  return isV3
    ? instance[contract].projectScriptDetails(projId)
    : instance[contract].projectScriptInfo(projId);
}

async function constructScript(projId, projectInfo, contract) {
  const scriptCount = Number(projectInfo.scriptCount);
  let fullScript = "";

  const batchSize = scriptCount > 30 ? 25 : scriptCount;

  for (let i = 0; i < scriptCount; i += batchSize) {
    const batchPromises = [];
    const batchEnd = Math.min(i + batchSize, scriptCount);

    for (let j = i; j < batchEnd; j++) {
      batchPromises.push(instance[contract].projectScriptByIndex(projId, j));
    }

    const batchScripts = await Promise.all(batchPromises);
    fullScript += batchScripts.join("");

    if (i + batchSize < scriptCount) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return fullScript;
}

async function fetchProjectDetails(projId, contract) {
  return instance[contract].projectDetails(projId);
}

async function fetchOwner(tokenId, contract) {
  const owner = await instance[contract].ownerOf(tokenId);
  const ensName = await provider.lookupAddress(owner).catch(() => null);
  return { owner, ensName };
}

function extractLibraryName(projectInfo) {
  if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
    return projectInfo[0].trim();
  } else {
    return JSON.parse(projectInfo[0]).type;
  }
}

async function fetchEditionInfo(projId, contract, isV3) {
  const invo =
    await instance[contract][isV3 ? "projectStateData" : "projectTokenInfo"](
      projId,
    );

  return {
    edition: Number(invo.maxInvocations),
    minted: Number(invo.invocations),
  };
}

async function fetchExtDepCount(projId, contract) {
  const count =
    await instance[contract].projectExternalAssetDependencyCount(projId);
  return count == 0 ? null : count;
}

async function fetchDependencies(projId, extDepCount, contract) {
  const cidPromises = Array.from({ length: Number(extDepCount) }, (_, i) =>
    instance[contract].projectExternalAssetDependencyByIndex(projId, i),
  );
  return Promise.all(cidPromises);
}

async function fetchV2CIDs(projId, extDepCount, contract) {
  const cidTuples = await fetchDependencies(projId, extDepCount, contract);
  return cidTuples.map((tuple) => ({
    cid: tuple[0],
    dependency_type: "IPFS",
    data: null,
    isOnchain: false,
  }));
}

async function fetchV3CIDs(projId, extDepCount, contract) {
  const cidTuples = await fetchDependencies(projId, extDepCount, contract);

  return cidTuples.map((tuple) => {
    const cid = tuple.cid;
    const dependencyType = Number(tuple.dependencyType || 0);
    const bytecodeAddress = tuple.bytecodeAddress || "";
    const data = tuple.data || "";

    if (dependencyType === 2) {
      let parsedData = {};
      try {
        if (data.startsWith("{")) {
          parsedData = JSON.parse(data);
        } else {
          parsedData = { raw: data };
        }
      } catch (error) {
        console.log("ONCHAIN data parsing error:", error);
        console.log("Raw ONCHAIN data:", data);
        parsedData = { raw: data };
      }

      return {
        cid: cid,
        dependency_type: "ONCHAIN",
        data: parsedData,
        bytecode_address: bytecodeAddress,
        isOnchain: true,
      };
    }

    return {
      cid: cid,
      dependency_type:
        dependencyType === 0
          ? "IPFS"
          : dependencyType === 1
            ? "ARWEAVE"
            : "ART_BLOCKS_DEPENDENCY_REGISTRY",
      data: null,
      isOnchain: false,
    };
  });
}

async function fetchGateway(contract) {
  const [ipfs, arweave] = await Promise.all([
    instance[contract].preferredIPFSGateway(),
    instance[contract].preferredArweaveGateway(),
  ]);
  return { ipfs, arweave };
}

/*---------------------------------------------------------
 *                  UI UPDATE FUNCTIONS
 *-------------------------------------------------------*/
function update(
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
  contractData = {
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

  localStorage.setItem("contractData", JSON.stringify(contractData));
  console.log(contractData);

  pushItemToLocalStorage(
    contract,
    tokenId,
    hash,
    script,
    extLib,
    extDep,
    ipfs,
    arweave,
  );
  const oldFrame = dom.frame;
  const frameContainer = oldFrame.parentNode;

  const newFrame = document.createElement("iframe");
  newFrame.id = "frame";
  newFrame.src = "about:blank";

  frameContainer.replaceChild(newFrame, oldFrame);
  dom.frame = newFrame;

  const platform = getPlatform(contract, projId);
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
  );

  setDisplay();
  injectFrame();
  toggleSpin(false);
}

function pushItemToLocalStorage(
  contract,
  tokenId,
  hash,
  script,
  extLib,
  extDep,
  ipfs,
  arweave,
) {
  if (
    (nameMap[contract] === "BMFLEX" && !tokenId.toString().startsWith("16")) ||
    (nameMap[contract] === "HODL" && tokenId.toString().startsWith("13"))
  ) {
    script = replaceIPFSGateways(script);
  }

  const process = extLib.startsWith("processing")
    ? "application/processing"
    : "";
  const src = [libs[extLib]];

  if (extDep.length > 0 && extDep[0].cid?.includes("@")) {
    src.push(libs[extDep[0].cid]);
  }

  let tokenIdHash = "";

  if (extDep.length > 0) {
    const cids = extDep
      .map((dep) => {
        if (dep.isOnchain) {
          return `{
             "cid": "${dep.cid}",
             "dependency_type": "${dep.dependency_type}",
             "data": ${JSON.stringify(dep.data)},
             "bytecode_address": "${dep.bytecode_address}"
           }`;
        }

        let cid = dep.cid;
        if (
          nameMap[contract] === "BMFLEX" &&
          tokenId.toString().startsWith("16")
        ) {
          cid = replaceIPFSGateways(cid);
        }

        const dependencyType =
          cid.startsWith("Qm") ||
          cid.startsWith("baf") ||
          cid.includes("/ipfs/")
            ? "IPFS"
            : /^[a-zA-Z0-9_-]{43}$/.test(cid)
              ? "ARWEAVE"
              : "ART_BLOCKS_DEPENDENCY_REGISTRY";

        return `{
           "cid": "${cid}",
           "dependency_type": "${dependencyType}",
           "data": null
         }`;
      })
      .join(",");

    tokenIdHash = `let tokenData = {
       "tokenId": "${tokenId}",
       "externalAssetDependencies": [${cids}],
       "preferredIPFSGateway": "${ipfs || "https://ipfs.io/ipfs/"}",
       "preferredArweaveGateway": "${arweave || "https://arweave.net/"}",
       "hash": "${hash}"
     }`;
  } else if (nameMap[contract] === "AB") {
    tokenIdHash = `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`;
  } else {
    tokenIdHash = `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`;
  }

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script }),
  );
}

const replaceIPFSGateways = (scriptContent) => {
  return scriptContent.replace(
    /https:\/\/(pinata\.[a-z0-9-]+\.[a-z]+|[a-z0-9-]+\.mypinata\.cloud)/g,
    "https://ipfs.io",
  );
};

const curated = [
  0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 17, 21, 23, 27, 28, 29, 35, 39, 40,
  41, 53, 59, 62, 64, 72, 74, 78, 89, 100, 114, 120, 129, 131, 138, 143, 147,
  159, 173, 204, 206, 209, 214, 215, 225, 232, 233, 250, 255, 261, 267, 282,
  284, 296, 304, 309, 320, 328, 333, 334, 336, 337, 341, 364, 367, 368, 376,
  379, 383, 385, 399, 406, 407, 412, 416, 417, 418, 423, 426, 428, 433, 455,
  456, 457, 462, 466, 471, 472, 482, 483, 484, 486, 487, 488, 493,
];

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

function getPlatform(contract, projId) {
  const contractName = nameMap[contract];

  if (["AB", "ABII", "ABIII"].includes(contractName)) {
    return getCuration(projId);
  }
  if (is.studio.includes(contractName)) {
    return "Art Blocks Studio";
  }

  return contractRegistry[contractName].platform || "";
}

function showExtDep(dependency) {
  if (!dependency) return false;

  const isOnchain = dependency.dependency_type === "ONCHAIN";
  const isArtBlocksRegistry =
    dependency.dependency_type === "ART_BLOCKS_DEPENDENCY_REGISTRY";

  return !isOnchain && !isArtBlocksRegistry;
}

function getExtDepType(dependency, contract) {
  if (nameMap[contract] === "BMFLEX") {
    return "ipfs";
  }

  const isIPFS =
    dependency.dependency_type === "IPFS" ||
    (dependency.cid &&
      (dependency.cid.startsWith("Qm") || dependency.cid.startsWith("baf")));

  return isIPFS ? "ipfs" : "arweave";
}

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
) {
  let artist = detail[1] || "Snowfro";
  const logs = [];

  dom.frame.contentWindow.console.log = (message) => {
    if (nameMap[contract] === "BMF" && !logs.length) {
      artist = message.replace(/Artist\s*\d+\.\s*/, "").replace(/\s*--.*/, "");
      logs.push(artist);
      update();
    }
  };

  const update = () => {
    dom.info.innerHTML = `${detail[0]} #${shortId(tokenId)} / ${artist}`;
    dom.panel.innerHTML = `
       <div class="work">${detail[0]}</div>
       <p>
         <span class="artist">${artist}${
           platform ? ` ● ${platform}` : ""
         }</span><br>
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
               instance[contract].target
             }" target="_blank">
               ${shortAddr(instance[contract].target)}
             </a>
             <span class="copy-txt" data-text="${instance[contract].target}">
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
             nameMap[contract] === "BMFLEX"
               ? createSection(
                   "EXTERNAL DEPENDENCY",
                   `<span class="no-copy-txt">
                     ${getExtDepType(extDep[0], contract)}
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
  update();
}

function shortId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0;
}

function shortAddr(address) {
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4,
  )}`;
}

function editionTxt(edition, minted) {
  return edition - minted > 0
    ? `${minted} / ${edition} Minted`
    : `${edition} Work${edition > 1 ? "s" : ""}`;
}

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

function extractDomain(url) {
  const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)(\/.*)?/);
  return match ? `${match[1]}${match[2] || ""}` : `${url}`;
}

function getLibVersion(extLib) {
  return (
    Object.keys(libs).find((key) =>
      key.startsWith(extLib.replace(/js$/, "") + "@"),
    ) || extLib
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

async function injectFrame() {
  try {
    const {
      src = [],
      tokenIdHash,
      process,
      script,
    } = JSON.parse(localStorage.getItem("scriptData"));

    const styles = `
      html { height: 100%; }
      body { min-height: 100%; margin: 0; padding: 0; background-color: transparent; }
      canvas { padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0; }`;

    const hasThree167 = src.some((s) => s && s.includes("three.js/0.167.0"));

    const scriptTags = hasThree167
      ? `<script type="importmap">
          {
            "imports": {
              "three":  "${src}"
            }
          }
        </script>`
      : src.map((s) => `<script src="${s}"></script>`).join("");

    const html = contractData.extLib.startsWith("custom")
      ? `<script>${tokenIdHash}</script>${script}`
      : `<!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
            ${scriptTags}
            <script>${tokenIdHash};</script>
            <style>${styles}</style>
          </head>
          <body>
            ${
              process
                ? `<script type="${process}">${script}</script><canvas></canvas>`
                : `<canvas${contractData.extLib.startsWith("babylon") ? ' id="babylon-canvas"' : ""}></canvas><script${hasThree167 ? ' type="module"' : ""}>${script}</script>`
            }
          </body>
        </html>`;

    const iframe = dom.frame.contentDocument;
    iframe.open();
    iframe.write(html);
    iframe.close();
  } catch (error) {
    console.error("injectFrame:", error);
  }
}

/*---------------------------------------------------------
 *                  TOKEN FUNCTIONS
 *-------------------------------------------------------*/
function getToken(line, searchQuery) {
  if (searchQuery === "curated") {
    getRandom(listManager.filteredList);
  } else if (/^\d+$/.test(searchQuery)) {
    handleNumericQuery(searchQuery);
  } else {
    handleOtherQuery(line, searchQuery);
  }
  dom.search.value = "";
  listManager.reset();
  displayList(listManager.originalList);
  clearPanels();
}

function handleNumericQuery(searchQuery) {
  const { contract, projId } = contractData;
  const id = parseInt(searchQuery.match(/\s*(\d+)/)[1]);
  const tokenId =
    projId === 0
      ? id
      : Number((projId * 1000000 + id).toString().padStart(6, "0"));

  grabData(tokenId, contract, true);
}

function handleOtherQuery(line, searchQuery) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*Work/;
  const [_, listContract, projIdStr, tokenStr] = line.match(regex);
  const projId = parseInt(projIdStr);
  const token = parseInt(tokenStr);
  const contract = indexMap[listContract];
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

  grabData(tokenId, contract);
}

function getRandom(source) {
  if (Array.isArray(source)) {
    const randomLine = source[Math.floor(Math.random() * source.length)];
    getToken(randomLine, "");
  } else if (typeof source === "object" && Object.keys(source).length > 0) {
    const randomKey =
      Object.keys(source)[
        Math.floor(Math.random() * Object.keys(source).length)
      ];
    clearDataStorage();
    contractData = source[randomKey];
    localStorage.setItem("contractData", JSON.stringify(contractData));
    update(...Object.values(contractData));
  }
}

function generateRandomHashAndToken() {
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

function exploreAlgo() {
  if (contractData.detail[0] === "Unigrids") return;

  const { hash, tokenId } = generateRandomHashAndToken();

  contractData.hash = hash;
  contractData.tokenId = tokenId;
  contractData.owner = "";
  contractData.ensName = "";

  localStorage.setItem("contractData", JSON.stringify(contractData));

  const scriptData = JSON.parse(localStorage.getItem("scriptData"));
  if (scriptData) {
    if (nameMap[contractData.contract] === "AB") {
      scriptData.tokenIdHash = `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`;
    } else {
      scriptData.tokenIdHash = `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`;
    }
    localStorage.setItem("scriptData", JSON.stringify(scriptData));
  }
  update(...Object.values(contractData));
}

function incrementTokenId() {
  let numericId = getId(contractData.tokenId);

  if (numericId === contractData.minted - 1) {
    numericId = 0;
  } else {
    numericId += 1;
  }

  contractData.tokenId = contractData.projId * 1000000 + numericId;

  grabData(contractData.tokenId, contractData.contract, true);
}

function decrementTokenId() {
  let numericId = getId(contractData.tokenId);

  if (numericId === 0) {
    numericId = contractData.minted - 1;
  } else {
    numericId -= 1;
  }

  contractData.tokenId = contractData.projId * 1000000 + numericId;

  grabData(contractData.tokenId, contractData.contract, true);
}

function getId(tokenId) {
  return tokenId % 1000000;
}

/*---------------------------------------------------------
 *                   LOOP FUNCTIONS
 *-------------------------------------------------------*/
function loopRandom(interval, action) {
  if (loopState.intervalId) {
    clearInterval(loopState.intervalId);
  }

  if (loopState.isLooping !== "true") {
    performAction(action, favorite);
  }

  loopState.intervalId = setInterval(() => {
    performAction(action, favorite);
  }, interval);

  loopState = {
    isLooping: "true",
    interval,
    action,
    intervalId: loopState.intervalId,
  };
  localStorage.setItem("loopState", JSON.stringify(loopState));
  console.log(loopState);
}

function performAction(action, favorite) {
  if (action === "allLoop") getRandom(listManager.originalList);
  else if (action === "favLoop") getRandom(favorite);
  else if (action === "curatedLoop") {
    listManager.filterByQuery("curated");
    getRandom(listManager.filteredList);
  } else if (action === "selectedLoop") {
    let random = Math.floor(
      Math.random() * (contractData.edition + 1),
    ).toString();
    getToken(listManager.filteredList[0], random);
  } else if (action === "oobLoop") {
    exploreAlgo();
  }
}

function stopRandomLoop() {
  if (loopState.intervalId) {
    clearInterval(loopState.intervalId);
  }
  loopState.isLooping = "false";
  localStorage.setItem("loopState", JSON.stringify(loopState));
}

function checkLoop() {
  dom.loopInput.placeholder = `${loopState.interval / 60000} min`;

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action);
}

function handleLoop(action) {
  clearPanels();

  let inputValue = dom.loopInput.value.trim();
  const inputVal = parseInt(inputValue, 10);

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * 60000)
      ? loopState.interval
      : inputVal * 60000;

  if (!isNaN(interval) && interval > 0) {
    loopRandom(interval, action);
    dom.loopInput.value = "";
    dom.loopInput.placeholder = `${interval / 60000} min`;
  } else {
    alert("Please enter a time in minutes.");
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    loopState = { isLooping: "false", interval: interval, action: action };
    localStorage.setItem("loopState", JSON.stringify(loopState));
  }
  updateLoopButton();
}

function stopLoop() {
  stopRandomLoop();
  updateLoopButton();
}

/*---------------------------------------------------------
 *             FAVORITE & SAVE FUNCTIONS
 *-------------------------------------------------------*/
async function saveOutput() {
  const content = dom.frame.contentDocument.documentElement.outerHTML;
  let id = shortId(contractData.tokenId);
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
  pushFavoriteToStorage(id);
}

function pushFavoriteToStorage(id) {
  const key = `
    <div class="fav-item">
      ${contractData.detail[0]} #${id}
      <span>${contractData.detail[1]}</span>
    </div>`;
  favorite[key] = contractData;
  localStorage.setItem("favorite", JSON.stringify(favorite));
  setDisplay();
}

function deleteFavoriteFromStorage(key) {
  if (favorite.hasOwnProperty(key)) {
    delete favorite[key];
    localStorage.setItem("favorite", JSON.stringify(favorite));
    setDisplay(true);
  }
}

function frameFavorite(key) {
  clearDataStorage();
  contractData = favorite[key];
  localStorage.setItem("contractData", JSON.stringify(contractData));
  update(...Object.values(contractData));
}

function displayFavoriteList() {
  dom.favPanel.innerHTML = "";

  for (let key in favorite) {
    if (favorite.hasOwnProperty(key)) {
      const keyElement = document.createElement("p");
      keyElement.style.display = "flex";
      keyElement.style.justifyContent = "space-between";
      keyElement.style.alignItems = "center";

      const delSpan = document.createElement("span");
      delSpan.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
      delSpan.style.color = "var(--color-btn)";
      delSpan.style.transition = "color 0.1s ease-in-out";

      delSpan.addEventListener("mouseenter", () => {
        delSpan.style.color = "indianred";
      });

      delSpan.addEventListener("mouseleave", () => {
        delSpan.style.color = "var(--color-btn)";
      });

      delSpan.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteFavoriteFromStorage(key);
        displayFavoriteList();
      });

      keyElement.addEventListener("click", () => {
        toggleSpin();
        frameFavorite(key);
        clearPanels();
      });

      keyElement.insertAdjacentHTML("afterbegin", key);
      keyElement.appendChild(delSpan);
      dom.favPanel.appendChild(keyElement);
    }
  }
}

/*---------------------------------------------------------
 *                  UTILITY FUNCTIONS
 *-------------------------------------------------------*/
const clearDataStorage = () => {
  ["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d));
};

const clearPanels = () => {
  [dom.overlay, dom.infobar, ...panels].forEach((el) =>
    el.classList.remove("active"),
  );
};

const togglePanel = (panelElement) => {
  panels.forEach((p) =>
    p !== panelElement ? p.classList.remove("active") : (p.scrollTop = 0),
  );

  const isActive = panelElement.classList.toggle("active");
  [dom.overlay, dom.infobar].forEach((el) =>
    el.classList.toggle("active", isActive),
  );
};

const toggleSpin = (show = true) => {
  dom.spinner.style.display = show ? "block" : "none";
};

const updateLoopButton = () => {
  document.querySelector(".fa-repeat").style.display =
    loopState.isLooping !== "true" ? "inline-block" : "none";

  document.querySelector(".fa-circle-stop").style.display =
    loopState.isLooping === "true" ? "inline-block" : "none";
};

const setDisplay = (skipOverlay = false) => {
  const hasContract = !!contractData;
  const hasRPC = !!rpcUrl;
  const hasFavorites = Object.keys(favorite).length > 0;

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

const tooltipTexts = {
  info: "More Info",
  settings: "Instructions",
  save: "Save Current Artwork",
  repeatIcon: "Loop Through Artworks",
  stopLoop: "Stop Loop",
  dec: "Previous Artwork",
  inc: "Next Artwork",
  explore: "Explore Algo",
  randomButton: "Random Artwork",
  searchIcon: "Search Collections",
  favIcon: "Favorites",
};

let tooltipTimeout = null;

function showTooltip(element, text) {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }

  tooltipTimeout = setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const infobarRect = dom.infobar.getBoundingClientRect();

    dom.tooltip.textContent = text;

    let leftPos = rect.left + rect.width / 2;

    dom.tooltip.style.visibility = "hidden";
    dom.tooltip.classList.add("active");

    const tooltipRect = dom.tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;

    const minLeft = 10 + tooltipWidth / 2;
    const maxLeft = window.innerWidth - 10 - tooltipWidth / 2;
    leftPos = Math.max(minLeft, Math.min(maxLeft, leftPos));

    dom.tooltip.style.left = `${leftPos}px`;
    dom.tooltip.style.bottom = `${window.innerHeight - infobarRect.top + 10}px`;
    dom.tooltip.style.color = "var(--color-btn)";
    dom.tooltip.style.transform = "translateX(-50%)";
    dom.tooltip.style.visibility = "visible";
  }, 500);
}

function hideTooltip() {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  dom.tooltip.classList.remove("active");
  dom.tooltip.style.visibility = "";
  dom.tooltip.style.opacity = "";
}

function initTooltips() {
  Object.entries(tooltipTexts).forEach(([key, text]) => {
    const element = dom[key];
    if (element) {
      element.addEventListener("mouseenter", () => showTooltip(element, text));
      element.addEventListener("mouseleave", hideTooltip);
      element.addEventListener("click", hideTooltip);
    }
  });
}

/*---------------------------------------------------------
 *                 THEME MANAGEMENT
 *-------------------------------------------------------*/
function setTheme(themeName) {
  dom.themeBtns.forEach((btn) =>
    btn.setAttribute("data-active", btn.dataset.theme === themeName),
  );

  if (themeName === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    dom.root.classList.toggle("dark-mode", prefersDark);
  } else {
    dom.root.classList.toggle("dark-mode", themeName === "dark");
  }

  localStorage.setItem("themePreference", themeName);
}

function initTheme() {
  setTheme(localStorage.getItem("themePreference") || "system");
}

/*---------------------------------------------------------
 *                 EVENT LISTENERS
 *-------------------------------------------------------*/
document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearDataStorage();
    location.reload();
  }
});

dom.rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const value = dom.rpcUrlInput.value.trim();

    value === ""
      ? localStorage.removeItem("rpcUrl")
      : localStorage.setItem("rpcUrl", value);

    location.reload();
  }
});

dom.search.addEventListener("input", (event) => {
  const query = event.target.value.trim().split("#")[0].trim();
  if (query !== "") {
    displayList(listManager.filterByQuery(query));
    if (!dom.listPanel.classList.contains("active")) {
      togglePanel(dom.listPanel);
    }
  } else {
    clearPanels();
  }
});

dom.search.addEventListener("keydown", handleKeyboardNavigation);

dom.listPanel.addEventListener("click", (event) => {
  const listItem = event.target.closest(".list-item");
  if (listItem) {
    const index = parseInt(listItem.dataset.index);
    listManager.selectedIndex = index;
    const selectedItem = listManager.getSelected();
    if (selectedItem) {
      getToken(selectedItem, "");
    }
  }
});

dom.settings.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(dom.instruction);
});

dom.info.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(dom.panel);
});

dom.searchIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  displayList(listManager.originalList);
  togglePanel(dom.listPanel);
});

dom.favIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  displayFavoriteList();
  togglePanel(dom.favPanel);
});

dom.repeatIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(dom.dropMenu);
});

loopTypes.forEach((type) => {
  dom[`${type}Loop`].addEventListener("click", () => handleLoop(`${type}Loop`));
});

dom.stopLoop.addEventListener("click", stopLoop);

dom.inc.addEventListener("click", incrementTokenId);

dom.dec.addEventListener("click", decrementTokenId);

dom.randomButton.addEventListener("click", () => {
  getRandom(listManager.originalList);
});

dom.explore.addEventListener("click", exploreAlgo);

dom.save.addEventListener("click", saveOutput);

panels.forEach((panel) => {
  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

document.addEventListener("click", clearPanels);

dom.themeBtns.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.theme));
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (localStorage.getItem("themePreference") === "system") {
      dom.root.classList.toggle("dark-mode", e.matches);
    }
  });

/*---------------------------------------------------------
 *                  INITIALIZATION
 *-------------------------------------------------------*/
updateLoopButton();
checkLoop();
checkForNewContracts();
setDisplay();
initTooltips();
initTheme();
if (contractData) update(...Object.values(contractData));
dom.root.classList.remove("no-flash");
