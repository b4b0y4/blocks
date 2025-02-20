import { ethers } from "./ethers.min.js";
import { libs, list } from "./lists.js";
import { contractsData, isV2, isFLEX, isStudio } from "./contracts.js";

const instruction = document.querySelector(".instruction");
const rpcUrlInput = document.getElementById("rpcUrl");
const loopInput = document.getElementById("loopInput");
const dropMenu = document.getElementById("dropMenu");
const frame = document.getElementById("frame");
const infobar = document.querySelector(".infobar");
const info = document.getElementById("info");
const save = document.getElementById("saveBtn");
const dec = document.getElementById("decrementBtn");
const inc = document.getElementById("incrementBtn");
const favIcon = document.querySelector(".fav-icon");
const search = document.getElementById("searchInput");
const overlay = document.querySelector(".overlay");
const panel = document.querySelector(".panel");
const listPanel = document.querySelector(".list-panel");
const favPanel = document.querySelector(".fav-panel");
const panels = [panel, listPanel, favPanel];

const rpcUrl = localStorage.getItem("rpcUrl");
const provider = new ethers.JsonRpcProvider(rpcUrl);

const contracts = [];
const nameMap = {};
const indexMap = {};

Object.keys(contractsData).forEach((key, index) => {
  const { abi, address } = contractsData[key];
  contracts.push(new ethers.Contract(address, abi, provider));
  nameMap[index] = key;
  indexMap[key] = index;
});

/**********************************************************
 *                UPDATE LIST FUNCTION
 *********************************************************/
const bloncks = ["ABC", ...isStudio];

// fetchBlocks(bloncks);

async function fetchBlocks(blocks) {
  const startMap = {
    ABII: 3,
    ABIII: 374,
    ABC: 494,
    ABXPACEII: 5,
    OONA: 2026,
    AXIOM: 35,
    GRAIL: 1,
    HODL: 1,
    UNITLDN: 1,
    PROOF: 1,
    WRLD: 1,
    GLITCH: 1,
    SHIS: 1,
  };

  for (const contractName of blocks) {
    const n = indexMap[contractName];
    const start = startMap[contractName] || 0;
    const end = Number(await contracts[n].nextProjectId());
    const results = [];

    for (let i = start; i < end; i++) {
      const [detail, token] = await Promise.all([
        contracts[n].projectDetails(i.toString()),
        isV2.includes(contractName)
          ? contracts[n].projectTokenInfo(i)
          : contracts[n].projectStateData(i),
      ]);
      const minted = Number(token.invocations) === 1 ? "item" : "items";
      const newItem = `"${contractName}${i} - ${detail[0]} / ${detail[1]} - ${token.invocations} ${minted}",`;
      const noQuoteItem = newItem.replace(/"/g, "").slice(0, -1);

      const itemExists = list.some((listItem) => listItem === noQuoteItem);

      if (!itemExists) results.push(newItem);
    }
    if (results.length > 0) console.log(results.join(" "));
  }
  console.log("blocks fetched.");
}

/**********************************************************
 *             GET DATA FROM ETHEREUM FUNCTIONS
 *********************************************************/
let contractData = {};

async function grabData(tokenId, contract) {
  try {
    toggleSpin();
    clearPanels();
    clearDataStorage();
    console.log("Contract:", contract, "\nToken Id:", tokenId);

    const isContractV2 = isV2.includes(nameMap[contract]);

    const [projectId, hash, { owner, ensName }] = await Promise.all([
      fetchProjectId(tokenId, contract),
      fetchHash(tokenId, contract),
      fetchOwner(tokenId, contract),
    ]);

    const projId = Number(projectId);

    const [projectInfo, detail, { edition, minted }] = await Promise.all([
      fetchProjectInfo(projId, contract, isContractV2),
      fetchProjectDetails(projId, contract),
      fetchEditionInfo(projId, contract, isContractV2),
    ]);

    const [script, extLib] = await Promise.all([
      constructScript(projId, projectInfo, contract),
      extractLibraryName(projectInfo),
    ]);

    let extDep = [];
    let ipfs = null;
    let arweave = null;

    if (isFLEX.includes(nameMap[contract])) {
      const extDepCount = await fetchExtDepCount(projId, contract);
      if (extDepCount) {
        [extDep, { ipfs, arweave }] = await Promise.all([
          fetchCIDs(projId, extDepCount, contract),
          fetchGateway(contract),
        ]);
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
    location.reload();
  } catch (error) {
    console.error("grabData:", error);
    search.placeholder = "error";
  }
}

async function fetchHash(tokenId, contract) {
  return contract == 0
    ? contracts[contract].showTokenHashes(tokenId)
    : contracts[contract].tokenIdToHash(tokenId);
}

async function fetchProjectId(tokenId, contract) {
  return contracts[contract].tokenIdToProjectId(tokenId);
}

async function fetchProjectInfo(projId, contract, isContractV2) {
  return isContractV2
    ? contracts[contract].projectScriptInfo(projId)
    : contracts[contract].projectScriptDetails(projId);
}

async function constructScript(projId, projectInfo, contract) {
  const scriptPromises = [];
  for (let i = 0; i < projectInfo.scriptCount; i++) {
    scriptPromises.push(contracts[contract].projectScriptByIndex(projId, i));
  }
  const scripts = await Promise.all(scriptPromises);
  return scripts.join("");
}

async function fetchProjectDetails(projId, contract) {
  return contracts[contract].projectDetails(projId);
}

async function fetchOwner(tokenId, contract) {
  const owner = await contracts[contract].ownerOf(tokenId);
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

async function fetchEditionInfo(projId, contract, isContractV2) {
  const invo =
    await contracts[contract][
      isContractV2 ? "projectTokenInfo" : "projectStateData"
    ](projId);

  return {
    edition: Number(invo.maxInvocations),
    minted: Number(invo.invocations),
  };
}

async function fetchExtDepCount(projId, contract) {
  const count =
    await contracts[contract].projectExternalAssetDependencyCount(projId);
  return count == 0 ? null : count;
}

async function fetchCIDs(projId, extDepCount, contract) {
  const cidPromises = [];
  for (let i = 0; i < extDepCount; i++) {
    cidPromises.push(
      contracts[contract].projectExternalAssetDependencyByIndex(projId, i),
    );
  }
  const cidTuples = await Promise.all(cidPromises);
  return cidTuples.map((tuple) => tuple[0]);
}

async function fetchGateway(contract) {
  const [ipfs, arweave] = await Promise.all([
    contracts[contract].preferredIPFSGateway(),
    contracts[contract].preferredArweaveGateway(),
  ]);
  return { ipfs, arweave };
}

async function updateContractData(tokenId, contract) {
  try {
    toggleSpin();
    clearPanels();
    console.log("Contract:", contract, "\nToken Id:", tokenId);

    const [hash, { owner, ensName }] = await Promise.all([
      fetchHash(tokenId, contract),
      fetchOwner(tokenId, contract),
    ]);

    contractData.tokenId = tokenId;
    contractData.hash = hash;
    contractData.owner = owner;
    contractData.ensName = ensName;

    localStorage.setItem("contractData", JSON.stringify(contractData));

    location.reload();
  } catch (error) {
    console.error("updateContractData:", error);
    search.placeholder = "error";
  }
}

/**********************************************************
 *              UPDATE UI FUNCTIONS
 *********************************************************/
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
  injectFrame();
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
  const process = extLib.startsWith("processing")
    ? "application/processing"
    : "";
  const src = [libs[extLib]];

  if (extDep.length > 0 && extDep[0].includes("@")) {
    src.push(libs[extDep[0]]);
  }

  let tokenIdHash = "";

  if (extDep.length > 0) {
    const cids = extDep
      .map((cid) => {
        const dependencyType =
          cid.startsWith("Qm") || cid.startsWith("baf")
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
  } else if (contract === 0) {
    tokenIdHash = `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`;
  } else {
    tokenIdHash = `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`;
  }

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script }),
  );
}

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
  if (isStudio.includes(contractName)) {
    return "Art Blocks Studio";
  }

  return contractsData[contractName].platform || "";
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

  frame.contentWindow.console.log = (message) => {
    if (nameMap[contract] === "BMF" && !logs.length) {
      artist = message.replace(/Artist\s*\d+\.\s*/, "").replace(/\s*--.*/, "");
      logs.push(artist);
      update();
    }
  };

  const update = () => {
    info.innerHTML = `${detail[0]} #${shortId(tokenId)} / ${artist}`;
    panel.innerHTML = `
      <div class="work">${detail[0]}</div>
      <p>
        <span class="artist">${artist}${
          platform ? ` ● ${platform}` : ""
        }</span><br>
        <span class="edition">${editionTxt(edition, minted)}</span>
      </p><br>
      <p>${detail[2]}</p>
      <div class="column-box">
        <div class="column">
          ${createSection(
            "OWNER",
            `<a href="https://zapper.xyz/account/${owner}" target="_blank">
              ${ensName || shortAddr(owner)}
            </a>
            <span class="copy-txt" data-text="${owner}">
              <i class="fa-regular fa-copy"></i>
            </span>`,
          )}
          ${createSection(
            "CONTRACT",
            `<a href="https://etherscan.io/address/${
              contracts[contract].target
            }" target="_blank">
              ${shortAddr(contracts[contract].target)}
            </a>
            <span class="copy-txt" data-text="${contracts[contract].target}">
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
                  ${extDep.length > 0 && extDep[0].length < 10 ? extDep[0] : ""}
                </span>`,
                )
              : ""
          }
          ${
            extDep.length > 0 &&
            (extDep[0].startsWith("Qm") ||
              extDep[0].startsWith("baf") ||
              /^[a-zA-Z0-9_-]{43}$/.test(extDep[0]))
              ? createSection(
                  "EXTERNAL DEPENDENCY",
                  `<span class="no-copy-txt">
                  ${
                    extDep[0].startsWith("Qm") || extDep[0].startsWith("baf")
                      ? "ipfs"
                      : "arweave"
                  }
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
    document.querySelectorAll(".copy-txt").forEach((element) =>
      element.addEventListener("click", () => {
        const textToCopy = element.getAttribute("data-text");
        copyToClipboard(textToCopy);

        const icon = element.querySelector("i");
        icon.classList.replace("fa-regular", "fa-solid");
        icon.classList.replace("fa-copy", "fa-check");

        setTimeout(() => {
          icon.classList.replace("fa-solid", "fa-regular");
          icon.classList.replace("fa-check", "fa-copy");
        }, 1000);
      }),
    );
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

/**********************************************************
 *           INJECT IFRAME FUNCTION
 *********************************************************/
async function injectFrame() {
  try {
    const iframeDocument =
      frame.contentDocument || frame.contentWindow.document;
    const scriptData = JSON.parse(localStorage.getItem("scriptData"));

    const frameBody = scriptData.process
      ? `<body><script type="${scriptData.process}">${scriptData.script}</script><canvas></canvas></body>`
      : `<body><canvas${
          contractData.extLib.startsWith("babylon")
            ? ' id="babylon-canvas"'
            : ""
        }></canvas><script>${scriptData.script}</script></body>`;

    const srcScripts = (scriptData.src || [])
      .map((src) => `<script src="${src}"></script>`)
      .join("");

    const dynamicContent = contractData.extLib.startsWith("custom")
      ? `<script>${scriptData.tokenIdHash}</script>${scriptData.script}`
      : `<!DOCTYPE html>
           <html>
             <head>
               <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
               ${srcScripts}
               <script>${scriptData.tokenIdHash};</script>
               <style type="text/css">
                 html { height: 100%; }
                 body { min-height: 100%; margin: 0; padding: 0; background-color: transparent; }
                 canvas { padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0; }
               </style>
             </head>
             ${frameBody}
           </html>`;

    iframeDocument.open();
    iframeDocument.write(dynamicContent);
    iframeDocument.close();
  } catch (error) {
    console.error("injectFrame:", error);
  }
}

/**********************************************************
 *              GET TOKEN FUNCTIONS
 *********************************************************/
function getToken(line, searchQuery) {
  if (searchQuery === "curated") {
    getRandom(filteredList);
  } else if (/^\d+$/.test(searchQuery)) {
    handleNumericQuery(searchQuery);
  } else {
    handleOtherQuery(line, searchQuery);
  }
}

function handleNumericQuery(searchQuery) {
  const { contract, projId } = contractData;
  const id = parseInt(searchQuery.match(/\s*(\d+)/)[1]);
  const tokenId =
    projId == 0
      ? id
      : Number((projId * 1000000 + id).toString().padStart(6, "0"));

  updateContractData(tokenId, contract);
}

function handleOtherQuery(line, searchQuery) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*item/;
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

/**********************************************************
 *        LIST DISPLAY/NAVIGATION FUNCTIONS
 *********************************************************/
let filteredList = list;
let selectedIndex = -1;

function displayList(lines) {
  const panel = lines
    .map((line, index) => {
      const parts = line.split(" - ");
      const displayText = parts.slice(1, parts.length - 1).join(" - ");
      const mintedInfo = parts[parts.length - 1];
      return `<p class="list-item" data-index="${index}">${displayText}<span>${mintedInfo}</span></p>`;
    })
    .join("");
  listPanel.innerHTML = `<div>${panel}</div>`;
}

function filterList(lines, query) {
  if (query.toLowerCase() === "curated") {
    filteredList = lines.filter((line) => {
      const idMatch = line.match(/^AB(?:II|III|C)?(\d+)/);
      if (idMatch) {
        const id = parseInt(idMatch[1]);
        return curated.includes(id) || line.startsWith("ABC");
      }
    });
  } else {
    filteredList = lines.filter((line) =>
      line.toLowerCase().includes(query.toLowerCase()),
    );
  }

  displayList(filteredList);
  selectedIndex = -1;
}
displayList(list);

function handleItemClick(event) {
  const listItem = event.target.closest(".list-item");
  if (listItem) {
    const selectedIndex = listItem.getAttribute("data-index");
    console.log("Item clicked:", filteredList[selectedIndex]);
    getToken(filteredList[selectedIndex], "");
    search.value = "";
  }
}

function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % filteredList.length;
  } else if (event.key === "ArrowUp") {
    if (selectedIndex === -1) {
      selectedIndex = filteredList.length - 1;
    } else {
      selectedIndex =
        (selectedIndex - 1 + filteredList.length) % filteredList.length;
    }
  } else if (event.key === "Enter") {
    if (selectedIndex !== -1) {
      console.log("Item clicked:", filteredList[selectedIndex]);
      getToken(filteredList[selectedIndex], "");
    } else {
      const query = search.value.trim();
      query === "" ? getRandom(list) : getToken(filteredList.join("\n"), query);
    }
    search.value = "";
  }

  const items = document.querySelectorAll(".list-item");
  items.forEach((item, index) => {
    item.classList.toggle("selected", index === selectedIndex);
  });

  if (selectedIndex !== -1)
    items[selectedIndex].scrollIntoView({ block: "nearest" });
}

search.addEventListener("input", (event) => {
  const query = event.target.value.trim().split("#")[0].trim();
  filterList(list, query);
});

search.addEventListener("keydown", handleKeyboardNavigation);

listPanel.addEventListener("click", handleItemClick);

/**********************************************************
 *              RANDOMNESS FUNCTIONS
 *********************************************************/
function getRandom(lines) {
  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  console.log("Randomly selected line:", randomLine);
  getToken(randomLine, "");
}

function getRandomKey(favorite) {
  const keys = Object.keys(favorite);

  if (keys.length > 0) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    clearDataStorage();

    contractData = favorite[randomKey];
    localStorage.setItem("contractData", JSON.stringify(contractData));
    console.log(randomKey);
    console.log(contractData);
    location.reload();
  }
}

document.getElementById("randomButton").addEventListener("click", () => {
  getRandom(list);
});

/**********************************************************
 *                  LOOP FUNCTIONS
 *********************************************************/
let intervalId;
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000,
  action: null,
};

function loopRandom(interval, action) {
  clearInterval(intervalId);
  const favorite = JSON.parse(localStorage.getItem("favorite"));

  if (loopState.isLooping !== "true") {
    performAction(action, favorite);
  }

  intervalId = setInterval(() => {
    performAction(action, favorite);
  }, interval);

  loopState = { isLooping: "true", interval, action };
  localStorage.setItem("loopState", JSON.stringify(loopState));
}

function performAction(action, favorite) {
  if (action === "loopAll") getRandom(list);
  else if (action === "favLoop") getRandomKey(favorite);
  else if (action === "curatedLoop") {
    filterList(list, "curated");
    getRandom(filteredList);
  } else if (action === "selectedLoop") {
    let random = Math.floor(
      Math.random() * (contractData.edition + 1),
    ).toString();
    getToken(list, random);
  }
}

function stopRandomLoop() {
  clearInterval(intervalId);
  loopState.isLooping = "false";
  localStorage.setItem("loopState", JSON.stringify(loopState));
}

function checkLocalStorage() {
  loopInput.placeholder = `${loopState.interval / 60000}m`;

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action);
}

function handleLoopClick(action) {
  dropMenu.classList.remove("active");

  let inputValue = loopInput.value.trim();
  const inputVal = parseInt(inputValue, 10);

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * 60000)
      ? loopState.interval
      : inputVal * 60000;

  if (!isNaN(interval) && interval > 0) {
    loopRandom(interval, action);
  } else {
    alert("Please enter a time in minutes.");
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    loopState = { isLooping: "false", interval: interval, action: action };
    localStorage.setItem("loopState", JSON.stringify(loopState));
  }
}

function stopLoop() {
  stopRandomLoop();
  updateButtons("loop");
}

/**********************************************************
 *           SAVE OUTPUT FUNCTION
 *********************************************************/
async function saveOutput() {
  const content = frame.contentDocument.documentElement.outerHTML;
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
  pushContractDataToStorage(id);
}

save.addEventListener("click", saveOutput);

/**********************************************************
 *   MANIPULATE SAVED OUTPUT IN STORAGE FUNCTIONS
 *********************************************************/
let favorite = JSON.parse(localStorage.getItem("favorite")) || {};

function pushContractDataToStorage(id) {
  const key = `${contractData.detail[0]} #${id} by ${contractData.detail[1]}`;
  favorite[key] = contractData;
  localStorage.setItem("favorite", JSON.stringify(favorite));
  updateFavIcon();
}

function deleteContractDataFromStorage(key) {
  if (favorite.hasOwnProperty(key)) delete favorite[key];
  localStorage.setItem("favorite", JSON.stringify(favorite));
  updateFavIcon();
}

function displayFavorite(key) {
  clearDataStorage();
  contractData = favorite[key];
  localStorage.setItem("contractData", JSON.stringify(contractData));
  location.reload();
}

function displayFavoriteList() {
  favPanel.innerHTML = "";

  for (let key in favorite) {
    if (favorite.hasOwnProperty(key)) {
      const keyElement = document.createElement("p");
      keyElement.textContent = key;
      const delSpan = document.createElement("span");
      delSpan.innerHTML = `<i class="fa-solid fa-xmark"></i>`;

      delSpan.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteContractDataFromStorage(key);
        displayFavoriteList();
      });

      keyElement.addEventListener("click", () => {
        toggleSpin();
        displayFavorite(key);
        clearPanels();
      });

      keyElement.appendChild(delSpan);
      favPanel.appendChild(keyElement);
    }
  }
}

/**********************************************************
 *       GET PREVIOUS/NEXT ID FUNCTIONS
 *********************************************************/
function getId(tokenId) {
  return tokenId % 1000000;
}

function incrementTokenId() {
  let numericId = getId(contractData.tokenId);

  if (numericId === contractData.minted - 1) {
    numericId = 0;
  } else {
    numericId += 1;
  }

  contractData.tokenId = contractData.projId * 1000000 + numericId;

  updateContractData(contractData.tokenId, contractData.contract);
}

function decrementTokenId() {
  let numericId = getId(contractData.tokenId);

  if (numericId === 0) {
    numericId = contractData.minted - 1;
  } else {
    numericId -= 1;
  }

  contractData.tokenId = contractData.projId * 1000000 + numericId;

  updateContractData(contractData.tokenId, contractData.contract);
}

inc.addEventListener("click", incrementTokenId);
dec.addEventListener("click", decrementTokenId);

/**********************************************************
 *               HELPER FUNCTIONS
 *********************************************************/
const clearDataStorage = () => {
  ["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d));
};

const clearPanels = () => {
  [overlay, infobar, ...panels].forEach((el) => el.classList.remove("active"));
};

const togglePanel = (panelElement) => {
  panels.forEach((p) => p !== panelElement && p.classList.remove("active"));
  const isActive = panelElement.classList.toggle("active");
  [overlay, infobar].forEach((el) => el.classList.toggle("active", isActive));
};

const toggleSpin = () => {
  document.querySelector(".spinner").style.display = "block";
  document.querySelector(".key-short").style.display = "none";
};

const toggleKeyShort = (event) => {
  document.querySelector(".key-short").style.display =
    event.type === "focusin" ? "none" : "block";
};

const updateButtons = (mode) => {
  const buttonConfig = {
    loop: {
      ".fa-repeat": loopState.isLooping !== "true",
      ".fa-circle-stop": loopState.isLooping === "true",
    },
    theme: {
      ".fa-sun": root.classList.contains("dark-mode"),
      ".fa-moon": !root.classList.contains("dark-mode"),
    },
  };
  Object.entries(buttonConfig[mode]).forEach(([selector, shouldDisplay]) => {
    document.querySelector(selector).style.display = shouldDisplay
      ? "inline-block"
      : "none";
  });
};

const setDisplay = (elements, value) => {
  elements.forEach((el) => (el.style.display = value));
};

function updateFavIcon() {
  const hasFavorites = Object.keys(favorite).length > 0;

  setDisplay([favIcon], hasFavorites ? "block" : "none");
  document
    .querySelector(".search-box")
    .classList.toggle("nofav", !hasFavorites);
  if (!hasFavorites) clearPanels();
}

function addHoverEffect(button, menu) {
  let timer;

  function showMenu() {
    clearTimeout(timer);
    menu.classList.add("active");
  }

  function hideMenu() {
    timer = setTimeout(() => {
      menu.classList.remove("active");
    }, 300);
  }

  button.addEventListener("mouseover", showMenu);
  button.addEventListener("mouseout", hideMenu);
  menu.addEventListener("mouseover", showMenu);
  menu.addEventListener("mouseout", hideMenu);
}
addHoverEffect(document.querySelector(".fa-repeat"), dropMenu);

/**********************************************************
 *                     EVENTS
 *********************************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateButtons("loop");
  checkLocalStorage();

  contractData = JSON.parse(localStorage.getItem("contractData"));
  if (contractData) update(...Object.values(contractData));
  if (!contractData) infobar.classList.add("active");
  if (!rpcUrl) document.getElementById("infoBox").style.display = "none";

  setDisplay([inc, dec, save], contractData ? "block" : "none");
  setDisplay([rpcUrlInput, instruction], rpcUrl ? "none" : "block");
  updateFavIcon();

  root.classList.remove("no-flash");
  console.log(contractData);
});

rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", rpcUrlInput.value);
    location.reload();
  }
});

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearDataStorage();
    location.reload();
  } else if (event.key === "/") {
    event.preventDefault();
    search.focus();
    togglePanel(listPanel);
  }
});

info.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(panel);
});

document.querySelector(".search-icon").addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(listPanel);
});

favIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  displayFavoriteList();
  togglePanel(favPanel);
});

document.addEventListener("click", () => {
  clearPanels();
});

panels.forEach((panel) => {
  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

search.addEventListener("input", () => {
  if (search.value.trim() !== "") {
    if (!listPanel.classList.contains("active")) {
      togglePanel(listPanel);
    }
  } else {
    clearPanels();
  }
});

search.addEventListener("focusin", toggleKeyShort);
search.addEventListener("focusout", toggleKeyShort);

document.getElementById("loopAll").addEventListener("click", () => {
  handleLoopClick("loopAll");
});
document.getElementById("favLoop").addEventListener("click", () => {
  handleLoopClick("favLoop");
});
document.getElementById("curatedLoop").addEventListener("click", () => {
  handleLoopClick("curatedLoop");
});
document.getElementById("selectedLoop").addEventListener("click", () => {
  handleLoopClick("selectedLoop");
});

document.querySelector(".fa-circle-stop").addEventListener("click", stopLoop);

document.getElementById("fullscreen").addEventListener("click", () => {
  if (frame.requestFullscreen) frame.requestFullscreen();
  else if (frame.mozRequestFullScreen) frame.mozRequestFullScreen();
  else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
  else if (frame.msRequestFullscreen) frame.msRequestFullscreen();
});

/**********************************************************
 *              DARK/LIGHT MODE TOGGLE
 *********************************************************/
const root = document.documentElement;

function setDarkMode(isDarkMode) {
  root.classList.toggle("dark-mode", isDarkMode);
  localStorage.setItem("darkMode", isDarkMode);
  updateButtons("theme");
}

function toggleDarkMode() {
  const isDarkMode = !root.classList.contains("dark-mode");
  setDarkMode(isDarkMode);
}

document.getElementById("theme").addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDarkMode();
});

setDarkMode(JSON.parse(localStorage.getItem("darkMode")));
