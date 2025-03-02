import { ethers } from "./ethers.min.js";
import { dom, panels } from "./dom.js";
import { list, libs, curated } from "./lists.js";
// import { contractsData, isV2, isFLEX, isStudio } from "./contracts.js";
import { fetchBlocks, checkForNewContracts } from "./fetch.js";
import {
  contractsData,
  isV2,
  isFLEX,
  isStudio,
  instance,
  nameMap,
  indexMap,
  initializeContracts,
} from "./contracts.js";

const rpcUrl = localStorage.getItem("rpcUrl");
const provider = new ethers.JsonRpcProvider(rpcUrl);

initializeContracts(provider);
// const instance = [];
// const nameMap = {};
// const indexMap = {};

let contractData = {};
let filteredList = list;
let selectedIndex = -1;
let intervalId;
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000,
  action: null,
};
let favorite = JSON.parse(localStorage.getItem("favorite")) || {};

// fetchBlocks(["ABC", ...isStudio, "STBYS", "PLOTII"]);

/**********************************************************
 *             GET DATA FROM ETHEREUM FUNCTIONS
 *********************************************************/
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
        if (nameMap[contract] === "BMFLEX") {
          extDep = await fetchCIDs(projId, extDepCount, contract);
          ipfs = "https://ipfs.io/ipfs";
        } else {
          [extDep, { ipfs, arweave }] = await Promise.all([
            fetchCIDs(projId, extDepCount, contract),
            fetchGateway(contract),
          ]);
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
    location.reload();
  } catch (error) {
    console.error("grabData:", error);
    dom.search.placeholder = "error";
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

async function fetchProjectInfo(projId, contract, isContractV2) {
  return isContractV2
    ? instance[contract].projectScriptInfo(projId)
    : instance[contract].projectScriptDetails(projId);
}

async function constructScript(projId, projectInfo, contract) {
  const scriptPromises = [];
  for (let i = 0; i < projectInfo.scriptCount; i++) {
    scriptPromises.push(instance[contract].projectScriptByIndex(projId, i));
  }
  const scripts = await Promise.all(scriptPromises);
  return scripts.join("");
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

async function fetchEditionInfo(projId, contract, isContractV2) {
  const invo =
    await instance[contract][
      isContractV2 ? "projectTokenInfo" : "projectStateData"
    ](projId);

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

async function fetchCIDs(projId, extDepCount, contract) {
  const cidPromises = [];
  for (let i = 0; i < extDepCount; i++) {
    cidPromises.push(
      instance[contract].projectExternalAssetDependencyByIndex(projId, i),
    );
  }
  const cidTuples = await Promise.all(cidPromises);
  return cidTuples.map((tuple) => tuple[0]);
}

async function fetchGateway(contract) {
  const [ipfs, arweave] = await Promise.all([
    instance[contract].preferredIPFSGateway(),
    instance[contract].preferredArweaveGateway(),
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
    dom.search.placeholder = "error";
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
  if (nameMap[contract] === "BMFLEX" && !tokenId.toString().startsWith("16")) {
    script = replaceIPFSGateways(script);
  }

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
  return scriptContent
    .replace(/https:\/\/pinata\.brightmoments\.io/g, "https://ipfs.io")
    .replace(/https:\/\/[a-z0-9-]+\.mypinata\.cloud/g, "https://ipfs.io");
};

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
                  ${extDep.length > 0 && extDep[0].length < 10 ? extDep[0] : ""}
                </span>`,
                )
              : ""
          }
          ${
            extDep.length > 0 || nameMap[contract] === "BMFLEX"
              ? createSection(
                  "EXTERNAL DEPENDENCY",
                  `<span class="no-copy-txt">
                  ${
                    nameMap[contract] === "BMFLEX" ||
                    extDep[0].startsWith("Qm") ||
                    extDep[0].startsWith("baf")
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

/**********************************************************
 *           INJECT IFRAME FUNCTION
 *********************************************************/
async function injectFrame() {
  try {
    const iframeDocument =
      dom.frame.contentDocument || dom.frame.contentWindow.document;
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
    projId === 0
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
function displayList(lines) {
  const panel = lines
    .map((line, index) => {
      const parts = line.split(" - ");
      const displayText = parts.slice(1, parts.length - 1).join(" - ");
      const mintedInfo = parts[parts.length - 1];
      return `<p class="list-item" data-index="${index}">${displayText}<span>${mintedInfo}</span></p>`;
    })
    .join("");
  dom.listPanel.innerHTML = `<div>${panel}</div>`;
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
    dom.search.value = "";
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
      const query = dom.search.value.trim();
      query === "" ? getRandom(list) : getToken(filteredList.join("\n"), query);
    }
    dom.search.value = "";
  }

  const items = document.querySelectorAll(".list-item");
  items.forEach((item, index) => {
    item.classList.toggle("selected", index === selectedIndex);
  });

  if (selectedIndex !== -1)
    items[selectedIndex].scrollIntoView({ block: "nearest" });
}

dom.search.addEventListener("input", (event) => {
  const query = event.target.value.trim().split("#")[0].trim();
  filterList(list, query);
});

dom.search.addEventListener("keydown", handleKeyboardNavigation);

dom.listPanel.addEventListener("click", handleItemClick);

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

dom.randomButton.addEventListener("click", () => {
  getRandom(list);
});

/**********************************************************
 *                  LOOP FUNCTIONS
 *********************************************************/
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
  dom.loopInput.placeholder = `${loopState.interval / 60000}m`;

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action);
}

function handleLoopClick(action) {
  dom.dropMenu.classList.remove("active");

  let inputValue = dom.loopInput.value.trim();
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
  pushContractDataToStorage(id);
}

dom.save.addEventListener("click", saveOutput);

/**********************************************************
 *   MANIPULATE SAVED OUTPUT IN STORAGE FUNCTIONS
 *********************************************************/
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
  dom.favPanel.innerHTML = "";

  for (let key in favorite) {
    if (favorite.hasOwnProperty(key)) {
      const keyElement = document.createElement("p");
      keyElement.textContent = key;
      keyElement.style.display = "flex";
      keyElement.style.justifyContent = "space-between";
      keyElement.style.alignItems = "center";

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
      dom.favPanel.appendChild(keyElement);
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

dom.inc.addEventListener("click", incrementTokenId);
dom.dec.addEventListener("click", decrementTokenId);

/**********************************************************
 *               HELPER FUNCTIONS
 *********************************************************/
const clearDataStorage = () => {
  ["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d));
};

const clearPanels = () => {
  [dom.overlay, dom.infobar, ...panels].forEach((el) =>
    el.classList.remove("active"),
  );
};

const togglePanel = (panelElement) => {
  panels.forEach((p) => p !== panelElement && p.classList.remove("active"));
  const isActive = panelElement.classList.toggle("active");
  [dom.overlay, dom.infobar].forEach((el) =>
    el.classList.toggle("active", isActive),
  );
};

const toggleSpin = () => {
  dom.spinner.style.display = "block";
  dom.keyShort.style.display = "none";
};

const toggleKeyShort = (event) => {
  dom.keyShort.style.display = event.type === "focusin" ? "none" : "block";
};

const updateButtons = (mode) => {
  const buttonConfig = {
    loop: {
      ".fa-repeat": loopState.isLooping !== "true",
      ".fa-circle-stop": loopState.isLooping === "true",
    },
    theme: {
      ".fa-sun": dom.root.classList.contains("dark-mode"),
      ".fa-moon": !dom.root.classList.contains("dark-mode"),
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

  setDisplay([dom.favIcon], hasFavorites ? "block" : "none");
  dom.searchBox.classList.toggle("nofav", !hasFavorites);
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

addHoverEffect(dom.repeatIcon, dropMenu);

/**********************************************************
 *                     EVENTS
 *********************************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateButtons("loop");
  checkLocalStorage();
  checkForNewContracts();

  contractData = JSON.parse(localStorage.getItem("contractData"));
  if (contractData) update(...Object.values(contractData));
  if (!contractData) dom.infobar.classList.add("active");
  if (!rpcUrl) dom.infoBox.style.display = "none";

  setDisplay([dom.inc, dom.dec, dom.save], contractData ? "block" : "none");
  setDisplay([dom.rpcUrlInput, dom.instruction], rpcUrl ? "none" : "block");
  updateFavIcon();

  dom.root.classList.remove("no-flash");
  console.log(contractData);
});

dom.rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", dom.rpcUrlInput.value);
    location.reload();
  }
});

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearDataStorage();
    location.reload();
  } else if (event.key === "/") {
    event.preventDefault();
    dom.search.focus();
    togglePanel(dom.listPanel);
  }
});

dom.info.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(dom.panel);
});

dom.searchIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePanel(dom.listPanel);
});

dom.favIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  displayFavoriteList();
  togglePanel(dom.favPanel);
});

document.addEventListener("click", () => {
  clearPanels();
});

panels.forEach((panel) => {
  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

dom.search.addEventListener("input", () => {
  if (dom.search.value.trim() !== "") {
    if (!dom.listPanel.classList.contains("active")) {
      togglePanel(dom.listPanel);
    }
  } else {
    clearPanels();
  }
});

dom.search.addEventListener("focusin", toggleKeyShort);
dom.search.addEventListener("focusout", toggleKeyShort);

dom.loopAll.addEventListener("click", () => {
  handleLoopClick("loopAll");
});
dom.favLoop.addEventListener("click", () => {
  handleLoopClick("favLoop");
});
dom.curatedLoop.addEventListener("click", () => {
  handleLoopClick("curatedLoop");
});
dom.selectedLoop.addEventListener("click", () => {
  handleLoopClick("selectedLoop");
});
dom.stopLoop.addEventListener("click", stopLoop);

dom.fullscreen.addEventListener("click", () => {
  if (dom.frame.requestFullscreen) dom.frame.requestFullscreen();
  else if (dom.frame.mozRequestFullScreen) dom.frame.mozRequestFullScreen();
  else if (dom.frame.webkitRequestFullscreen)
    dom.frame.webkitRequestFullscreen();
  else if (dom.frame.msRequestFullscreen) dom.frame.msRequestFullscreen();
});

/**********************************************************
 *              DARK/LIGHT MODE TOGGLE
 *********************************************************/
function setDarkMode(isDarkMode) {
  dom.root.classList.toggle("dark-mode", isDarkMode);
  localStorage.setItem("darkMode", isDarkMode);
  updateButtons("theme");
}

function toggleDarkMode() {
  const isDarkMode = !dom.root.classList.contains("dark-mode");
  setDarkMode(isDarkMode);
}

dom.theme.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDarkMode();
});

setDarkMode(JSON.parse(localStorage.getItem("darkMode")));
