import { ethers } from "./libs/ethers.min.js";
import { list, libs, curated, playground } from "./data.js";
import { contractRegistry, is } from "./constants.js";

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

const rpcUrl = localStorage.getItem("rpcUrl");
const provider = new ethers.JsonRpcProvider(rpcUrl);

rpcUrl
  ? (dom.rpcUrlInput.placeholder = rpcUrl)
  : (dom.rpcUrlInput.placeholder = "Enter RPC URL");

const instance = [];
const nameMap = {};
const indexMap = {};

Object.keys(contractRegistry).forEach((key, index) => {
  const { abi, address } = contractRegistry[key];
  instance.push(new ethers.Contract(address, abi, provider));
  nameMap[index] = key;
  indexMap[key] = index;
});

let contractData = JSON.parse(localStorage.getItem("contractData"));
let favorite = JSON.parse(localStorage.getItem("favorite")) || {};
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000,
  action: null,
  intervalId: null,
};

// Treats the last slash-separated segment as the artist and everything before as the collection.
function splitCollectionAndArtist(text) {
  const parts = text.split(" / ").map((s) => s.trim());
  const artist = parts.length > 0 ? parts[parts.length - 1] : "";
  const collection =
    parts.length > 1 ? parts.slice(0, -1).join(" / ") : parts[0] || "";
  return { collection, artist };
}

class ListManager {
  constructor(listData) {
    this.originalList = listData.filter((line) => !line.trim().endsWith("!"));
    this.filteredList = listData;
    this.selectedIndex = -1;
  }

  filterByQuery(query) {
    query = query.toLowerCase().trim();

    if (query === "curated") {
      this.filteredList = this.originalList.filter((line) => {
        const idMatch = line.match(/^AB(?:II|III|C|CFLEX)?(\d+)/);
        return (
          idMatch &&
          (curated.includes(parseInt(idMatch[1])) || line.startsWith("ABC"))
        );
      });
    } else {
      const exactMatches = [];
      const partialMatches = [];

      this.originalList.forEach((line) => {
        const parts = line.split(" # ");
        if (parts.length > 1) {
          const { collection, artist } = splitCollectionAndArtist(parts[1]);
          const collectionLower = collection.trim().toLowerCase();
          const artistLower = artist.trim().toLowerCase();

          if (collectionLower === query) {
            exactMatches.push(line);
          } else if (
            collectionLower.includes(query) ||
            (artistLower && artistLower.includes(query))
          ) {
            partialMatches.push(line);
          }
        }
      });
      this.filteredList =
        exactMatches.length > 0 ? exactMatches : partialMatches;
    }

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

function displayList(items, numberQuery = "") {
  const listItems = items
    .map((line, index) => {
      const parts = line.split(" # ");
      const { collection, artist } = splitCollectionAndArtist(parts[1]);
      const workCount = parts[parts.length - 1];

      const displayName = numberQuery
        ? `${collection} #${numberQuery}`
        : collection;

      return `<p class="list-item ${index === listManager.selectedIndex ? "selected" : ""}"
               data-index="${index}">
               ${displayName}
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

    const query = dom.search.value.trim();
    const queryParts = query.split("#");
    const numberQuery = queryParts.length > 1 ? queryParts[1].trim() : "";
    displayList(listManager.filteredList, numberQuery);

    const selectedItem = dom.listPanel.querySelector(
      `[data-index="${newIndex}"]`,
    );
    selectedItem?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    const selectedItem = listManager.getSelected();
    const query = dom.search.value.trim();
    if (selectedItem) {
      getToken(selectedItem, query);
    } else {
      if (query === "curated") {
        getRandom(listManager.filteredList);
      } else if (query === "") {
        getRandom(listManager.originalList);
      } else if (listManager.filteredList.length > 0) {
        getToken(listManager.filteredList[0], query);
      }
    }
  }
}

// Aggregates all project data for a given token.
// Used for both full loads and partial updates.
async function grabData(tokenId, contract, updateOnly = false) {
  try {
    toggleSpin();
    clearPanels();
    console.log("Contract:", contract, "Token Id:", tokenId);

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

      const pmpv0Address = contractRegistry.ABPMPV0.address.toLowerCase();
      const onchainPmpv0Dep = data.extDep?.find(
        (dep) =>
          dep.dependency_type === "ONCHAIN" &&
          dep.bytecode_address.toLowerCase() === pmpv0Address,
      );

      if (onchainPmpv0Dep) {
        data.tokenParams = await fetchTokenParams(
          instance,
          contract,
          tokenId,
          indexMap,
        );
      }

      localStorage.setItem("contractData", JSON.stringify(data));
      update(...Object.values(data));
    } else {
      clearDataStorage();

      const projId = Math.floor(tokenId / 1000000);
      const isV3 = is.v3.includes(nameMap[contract]);
      const [
        hash,
        projectInfo,
        detail,
        { owner, ensName },
        { edition, minted },
      ] = await Promise.all([
        fetchHash(tokenId, contract),
        fetchProjectInfo(projId, contract, isV3),
        fetchProjectDetails(projId, contract),
        fetchOwner(tokenId, contract),
        fetchEditionInfo(projId, contract, isV3),
      ]);

      const [script, extLib] = await Promise.all([
        constructScript(projId, projectInfo, contract),
        extractLibraryName(projectInfo),
      ]);

      let extDep = [];
      let ipfs = null;
      let arweave = null;
      let tokenParams = null;

      if (is.flex.includes(nameMap[contract])) {
        const extDepCount = await fetchExtDepCount(projId, contract);
        if (extDepCount) {
          const fetchCIDsFn = isV3 ? fetchV3CIDs : fetchV2CIDs;
          [extDep, { ipfs, arweave }] = await Promise.all([
            fetchCIDsFn(projId, extDepCount, contract),
            fetchGateway(contract),
          ]);
          if (["BMFLEX", "NUMBER"].includes(nameMap[contract])) {
            ipfs = "https://ipfs.io/ipfs";
          }
        }

        const pmpv0Address = contractRegistry.ABPMPV0.address.toLowerCase();
        const onchainPmpv0Dep = extDep.find(
          (dep) =>
            dep.dependency_type === "ONCHAIN" &&
            dep.bytecode_address.toLowerCase() === pmpv0Address,
        );

        if (onchainPmpv0Dep) {
          tokenParams = await fetchTokenParams(
            instance,
            contract,
            tokenId,
            indexMap,
          );
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
        tokenParams,
      };

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
  if (!projectInfo[0]) {
    return "js";
  } else if (
    typeof projectInfo[0] === "string" &&
    projectInfo[0].includes("@")
  ) {
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

// Handles on-chain and off-chain dependency types.
async function fetchV3CIDs(projId, extDepCount, contract) {
  const cidTuples = await fetchDependencies(projId, extDepCount, contract);

  return cidTuples.map((tuple) => {
    const cid = tuple.cid;
    const dependencyType = Number(tuple.dependencyType || 0);
    const bytecodeAddress = tuple.bytecodeAddress || "";
    const data = tuple.data || "";

    if (dependencyType === 2) {
      let parsedData = data;
      try {
        if (data.startsWith("{")) {
          parsedData = JSON.parse(data);
        }
      } catch (error) {
        console.log("ONCHAIN data parsing error:", error);
        console.log("Raw ONCHAIN data:", data);
        parsedData = data;
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

async function fetchTokenParams(instance, contract, tokenId, indexMap) {
  const pmpv0Contract = instance[indexMap["ABPMPV0"]];
  const tokenParamsRaw = await pmpv0Contract
    .getTokenParams(instance[contract].target, tokenId)
    .catch(() => []);

  const tokenParams = tokenParamsRaw.reduce((acc, [key, value]) => {
    acc[key] = typeof value === "bigint" ? value.toString() : value;
    return acc;
  }, {});

  return tokenParams;
}

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
  tokenParams,
) {
  const platform = getPlatform(contract, projId);
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
    tokenParams,
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
    tokenParams,
  );
  injectFrame();
  updateUI(
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
  setUIControls();
  toggleSpin(false);
}

function pushItemToLocalStorage(
  contract,
  tokenId,
  hash,
  script,
  extLib,
  extDep = [],
  ipfs,
  arweave,
  tokenParams,
) {
  const contractName = nameMap[contract];
  const tokenIdStr = tokenId.toString();

  if (
    (contractName === "BMFLEX" && !tokenIdStr.startsWith("16")) ||
    (contractName === "HODL" && tokenIdStr.startsWith("13"))
  ) {
    script = replaceIPFSGateways(script);
  }

  const src = [libs[extLib]];
  if (extDep[0]?.cid?.includes("@")) src.push(libs[extDep[0].cid]);

  const ipfsUrl = ipfs || "https://ipfs.io/ipfs/";
  const arweaveUrl = arweave || "https://arweave.net/";

  const tokenData = { tokenId: tokenId.toString() };

  if (extDep.length) {
    const pmpv0Address = contractRegistry.ABPMPV0.address.toLowerCase();
    tokenData.externalAssetDependencies = extDep.map((d) => {
      let cid = d.cid;
      if (contractName === "BMFLEX" && tokenIdStr.startsWith("16")) {
        cid = replaceIPFSGateways(cid);
      }
      const type = d.isOnchain
        ? d.dependency_type
        : /^(Qm|baf)/.test(cid) || cid.includes("/ipfs/")
          ? "IPFS"
          : /^[\w-]{43}$/.test(cid)
            ? "ARWEAVE"
            : "ART_BLOCKS_DEPENDENCY_REGISTRY";

      let data = d.isOnchain ? d.data : null;
      if (
        d.dependency_type === "ONCHAIN" &&
        d.bytecode_address.toLowerCase() === pmpv0Address &&
        tokenParams &&
        Object.keys(tokenParams).length > 0
      ) {
        data = tokenParams;
      }

      const dependency = {
        cid,
        dependency_type: type,
        data,
      };

      if (d.bytecode_address) {
        dependency.bytecode_address = d.bytecode_address;
      }

      return dependency;
    });
    tokenData.preferredIPFSGateway = ipfsUrl;
    tokenData.preferredArweaveGateway = arweaveUrl;
    tokenData.hash = hash;
  } else if (contractName === "AB") {
    tokenData.hashes = Array.isArray(hash) ? hash : [hash];
  } else {
    tokenData.hash = hash;
  }

  const tokenIdHash = `let tokenData = ${JSON.stringify(tokenData)}`;

  localStorage.setItem(
    "scriptData",
    JSON.stringify({
      src,
      tokenIdHash,
      process: extLib.startsWith("processing") ? "application/processing" : "",
      script,
    }),
  );
}

const replaceIPFSGateways = (scriptContent) => {
  return scriptContent.replace(
    /https:\/\/(pinata\.[a-z0-9-]+\.[a-z]+|[a-z0-9-]+\.mypinata\.cloud)/g,
    "https://ipfs.io",
  );
};

function getPlatform(contract, projId) {
  const contractName = nameMap[contract];

  if (["AB", "ABII", "ABIII"].includes(contractName)) {
    return curated.includes(projId)
      ? "Art Blocks Curated"
      : playground.includes(projId)
        ? "Art Blocks Playground"
        : projId < 374
          ? "Art Blocks Factory"
          : "Art Blocks Presents";
  }
  if (is.studio.includes(contractName)) {
    return "Art Blocks Studio";
  }

  return contractRegistry[contractName].platform || "";
}

function updateUI(
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
  const renderInfo = () => {
    const infoText = `${detail[0]} #${shortId(tokenId)}${detail[1] ? ` / ${detail[1]}` : ""}`;

    // Cleanup previous content and classes
    dom.info.innerHTML = "";
    dom.info.classList.remove("scrolling");

    const spanElement = document.createElement("span");
    spanElement.textContent = infoText;
    dom.info.appendChild(spanElement);

    const infoElement = dom.info;

    // Check for overflow
    if (spanElement.offsetWidth > infoElement.offsetWidth) {
      // Slow down the animation
      const scrollDuration = spanElement.offsetWidth / 30;
      infoElement.style.setProperty("--scroll-duration", `${scrollDuration}s`);

      // Duplicate the span for a seamless loop
      const duplicateSpan = spanElement.cloneNode(true);
      duplicateSpan.setAttribute("aria-hidden", "true");
      infoElement.appendChild(duplicateSpan);

      infoElement.classList.add("scrolling");
    }

    const showLib =
      extLib &&
      !extLib.startsWith("js") &&
      !extLib.startsWith("svg") &&
      !extLib.startsWith("custom");
    const libInfo = showLib
      ? getLibVersion(extLib) +
        (extDep.length > 0 && extDep[0].cid && extDep[0].cid.length < 10
          ? ` <br> ${extDep[0].cid}`
          : "")
      : "";

    const showExt =
      (extDep.length > 0 && showExtDep(extDep[0])) ||
      nameMap[contract] === "BMFLEX";
    const extInfo = showExt ? getExtDepType(extDep[0], contract) : "";

    const dependencyInfo =
      libInfo && extInfo ? `${libInfo} <br> ${extInfo}` : libInfo || extInfo;

    dom.panel.innerHTML = `
       <div class="work">${detail[0]}</div>
       <p>
         <span class="artist">${detail[1]}${
           platform ? ` &bull; ${platform}` : ""
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
             dependencyInfo
               ? createSection(
                   "DEPENDENCY",
                   `<span class="no-copy-txt">${dependencyInfo}</span>`,
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
  renderInfo();
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

    const iframe = dom.frame;
    iframe.srcdoc = html;
  } catch (error) {
    console.error("injectFrame:", error);
  }
}

function getToken(line, searchQuery) {
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
  dom.search.value = "";
  listManager.reset();
  displayList(listManager.originalList);
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
  clearPanels();

  if (action === "allLoop") getRandom(listManager.originalList);
  else if (action === "favLoop") getRandom(favorite);
  else if (action === "curatedLoop") {
    listManager.filterByQuery("curated");
    getRandom(listManager.filteredList);
  } else if (action === "selectedLoop") {
    const projectLine = listManager.originalList.find(
      (line) =>
        splitCollectionAndArtist(line.split(" # ")[1]).collection.trim() ===
        contractData.detail[0],
    );
    getToken(projectLine, "");
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
  setUIControls();
}

function deleteFavoriteFromStorage(key) {
  if (favorite.hasOwnProperty(key)) {
    delete favorite[key];
    localStorage.setItem("favorite", JSON.stringify(favorite));
    setUIControls(true);
  }
}

function frameFavorite(key) {
  clearDataStorage();
  contractData = favorite[key];
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
      delSpan.className = "delete-btn";
      delSpan.innerHTML = `<i class="fa-solid fa-xmark"></i>`;

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

const setUIControls = (skipOverlay = false) => {
  const hasContract = !!contractData;
  const hasRPC = !!rpcUrl;
  const hasFavorites = Object.keys(favorite).length > 0;

  dom.infobar.style.opacity = !hasRPC || !hasContract ? "0.9" : "";

  [dom.inc, dom.dec, dom.save, dom.info, dom.explore, dom.loop].forEach(
    (button) => (button.style.display = hasContract ? "block" : "none"),
  );

  const showInstruction = !hasRPC;
  dom.instruction.classList.toggle("active", showInstruction);
  if (!skipOverlay) dom.overlay.classList.toggle("active", showInstruction);

  dom.favIcon.style.display = hasFavorites ? "block" : "none";
  dom.searchBox.classList.toggle("nofav", !hasFavorites);
  if (!hasFavorites && hasRPC) clearPanels();
};

const tooltipTexts = {
  info: "More Info",
  settings: "Settings",
  save: "Save Current Artwork",
  repeatIcon: "Loop Through Artworks",
  stopLoop: "Stop Loop",
  dec: "Previous Artwork",
  inc: "Next Artwork",
  explore: "Explore Algo",
  randomButton: "Random Artwork",
  searchIcon: "Search Collections",
  favIcon: "Favorites List",
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
  const query = event.target.value.trim();

  // Searching for a specific # with artwork already loaded
  if (query.startsWith("#") && contractData) {
    const num = query.substring(1);

    if (!/^\d*$/.test(num)) {
      clearPanels();
      return;
    }

    // Find the original list entry for the current artwork
    const currentArtName = contractData.detail[0];
    const originalLine = listManager.originalList.find((line) =>
      line.includes(currentArtName),
    );

    if (originalLine) {
      listManager.filteredList = [originalLine];
      listManager.selectedIndex = 0;

      const parts = originalLine.split(" # ");
      const { collection, artist } = splitCollectionAndArtist(parts[1]);
      const workCount = parts[parts.length - 1];

      const listItemHTML = `<p class="list-item selected" data-index="0">
         ${collection}${num ? ` #${num}` : ""}
         <span>${artist} - ${workCount}</span>
      </p>`;

      dom.listPanel.innerHTML = `<div>${listItemHTML}</div>`;
      if (!dom.listPanel.classList.contains("active")) {
        togglePanel(dom.listPanel);
      }
    } else {
      clearPanels();
    }
  } else {
    // Standard search behavior
    const queryParts = query.split("#");
    const searchQuery = queryParts[0].trim();
    const numberQuery = queryParts.length > 1 ? queryParts[1].trim() : "";

    if (searchQuery !== "") {
      const filteredItems = listManager.filterByQuery(searchQuery);
      displayList(filteredItems, numberQuery);
      if (!dom.listPanel.classList.contains("active")) {
        togglePanel(dom.listPanel);
      }
    } else {
      clearPanels();
    }
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
      const query = dom.search.value.trim();
      getToken(selectedItem, query);
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

updateLoopButton();
checkLoop();
setUIControls();
initTooltips();
initTheme();
if (contractData) update(...Object.values(contractData));
dom.root.classList.remove("no-flash");

// Fetches project data for one or more contracts, identifies new items, and logs them to the console.
async function blocks(...contract) {
  const contractArray =
    Array.isArray(contract[0]) && contract.length === 1
      ? contract[0]
      : contract;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const contractName of contractArray) {
    const n = indexMap[contractName];
    const start = contractRegistry[contractName].startProjId || 0;
    const end = Number(await instance[n].nextProjectId());
    const newBlocks = [];
    const BATCH = 10;
    const DELAY_MS = 1500;

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
            newBlocks.push(`"${newItem}",`);
          }
        }
      });

      if (id + BATCH < end) {
        await delay(DELAY_MS);
      }
    }

    if (newBlocks.length > 0) {
      console.log(`%cNew items for ${contractName}:`, "color: seagreen;");
      console.log(`%c${newBlocks.join("\n")}`, "color: gold");
    } else {
      console.log(`%cNo new items for ${contractName}.`, "color: grey;");
    }
  }
}

window.fetchBlocks = async (...contracts) => {
  let contractArray;

  if (contracts.length === 1 && Array.isArray(contracts[0])) {
    contractArray = contracts[0];
  } else if (contracts.length >= 1) {
    contractArray = contracts;
  } else {
    console.error("Please provide contract name(s) as arguments.");
    return;
  }

  console.log(
    `%cFetching blocks for:%c${contractArray.join(", ")}`,
    "color: indianred;",
    "color: grey;",
  );

  await blocks(contractArray);
  console.log("%cDone fetching!", "color: indianred;");
};

window.is = is;
Object.keys(contractRegistry).forEach((contractName) => {
  window[contractName.toLowerCase()] = contractName;
});
