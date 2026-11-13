import { makeCall, lookupAddress } from "./rpc.js";
import { list, libs, curated, playground, platformOverrides } from "./data.js";
import { contractRegistry, is, abiProfiles, frozenContracts } from "./constants.js";
import * as ov from "./overlay.js";

const $ = (selector) => document.querySelector(selector);
const byId = (...names) =>
  Object.fromEntries(names.map((name) => [name, document.getElementById(name)]));

const dom = {
  root: document.documentElement,
  themeBtns: document.querySelectorAll(".theme-button"),
  instruction: $(".instruction"),
  infobar: $(".infobar"),
  favMenu: $(".fav-menu"),
  spinner: $(".spinner"),
  panel: $(".panel"),
  listPanel: $(".list-panel"),
  favPanel: $(".fav-panel"),
  overlay: $(".overlay"),
  tooltip: $(".tooltip"),
  managePanel: $(".manage-panel"),
  rpcUrlInput: document.getElementById("rpcUrl"),
  dec: document.getElementById("decrementBtn"),
  inc: document.getElementById("incrementBtn"),
  allLoop: document.getElementById("loopAll"),
  search: document.getElementById("searchInput"),
  manage: document.getElementById("manageBtn"),
  ...byId(
    "settings", "frame", "info", "explore", "loop", "repeatIcon", "dropMenu",
    "favLoop", "curatedLoop", "selectedLoop", "oobLoop", "stopLoop", "loopInput",
    "randomButton", "searchIcon", "favIcon", "favSave", "favOpen",
    "manageClose", "manageListRows", "collectionForm", "collectionTarget",
    "collectionName", "collectionArtist", "collectionWorks", "collectionCancel",
    "collectionStatus", "manageCopyList", "manageReset", "manageUpdate",
    "copyStatus",
    "updateStatus", "manageUpdateResults", "manageContractRows", "contractToggle",
    "contractSection", "contractSectionToggle", "contractSectionLabel",
    "contractSectionIcon", "contractForm", "contractKey", "contractAbi",
    "contractAddress",
    "contractPlatform", "contractStart", "contractCancel", "contractStatus",
    "manageCopyContracts",
  ),
};

const panels = [
  dom.instruction,
  dom.panel,
  dom.listPanel,
  dom.favPanel,
  dom.favMenu,
  dom.dropMenu,
  dom.managePanel,
];

const loopTypes = ["all", "fav", "curated", "selected", "oob"];

const load = (key) => JSON.parse(localStorage.getItem(key));
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const rpcUrl = localStorage.getItem("rpcUrl");
const call = makeCall(rpcUrl);

dom.rpcUrlInput.placeholder = rpcUrl || "Enter RPC URL";

let overlay = ov.loadOverlay();
const baseContractRegistry = contractRegistry;
let registry = {};
let PMPV0_ADDR = "";
let activeList = [];

function pruneFrozenOverlay() {
  const changedLine = (change) =>
    change.type === "add" ? change.line : change.original;
  const countBefore =
    overlay.list.length + Object.keys(overlay.contracts).length;

  overlay.list = overlay.list.filter((change) => {
    const parsed = ov.parseListLine(changedLine(change));
    return !parsed || !frozenContracts.has(parsed.contract);
  });

  Object.keys(overlay.contracts).forEach((key) => {
    if (frozenContracts.has(key)) delete overlay.contracts[key];
  });

  const countAfter =
    overlay.list.length + Object.keys(overlay.contracts).length;
  if (countAfter !== countBefore) ov.saveOverlay(overlay);
}

pruneFrozenOverlay();

if (ov.pruneReconciledAdditions(overlay, list)) ov.saveOverlay(overlay);

const nameMap = {};
const indexMap = {};

const contractEntryFromConfig = (config) => {
  const abi = abiProfiles[config.abi];
  if (!abi) return null;

  return {
    abi,
    address: config.address,
    ...(config.platform ? { platform: config.platform } : {}),
    ...(config.startProjId !== undefined
      ? { startProjId: config.startProjId }
      : {}),
  };
};

function rebuildRuntimeContracts() {
  registry = { ...baseContractRegistry };

  Object.entries(overlay.contracts).forEach(([key, config]) => {
    const entry = contractEntryFromConfig(config);
    if (entry) registry[key] = entry;
  });

  Object.keys(nameMap).forEach((key) => delete nameMap[key]);
  Object.keys(indexMap).forEach((key) => delete indexMap[key]);

  Object.keys(registry).forEach((key, index) => {
    nameMap[index] = key;
    indexMap[key] = index;
  });

  is.v3.length = 0;
  is.flex.length = 0;
  is.studio.length = 0;
  is.engine.length = 0;

  Object.entries(registry).forEach(([key, entry]) => {
    const abiName =
      overlay.contracts[key]?.abi ||
      Object.keys(abiProfiles).find((name) => abiProfiles[name] === entry.abi);

    if (abiName?.includes("3")) is.v3.push(key);
    if (abiName?.includes("Flex")) is.flex.push(key);
    if (key.startsWith("ABS")) is.studio.push(key);
    else if (!key.startsWith("AB") && !frozenContracts.has(key))
      is.engine.push(key);
  });

  PMPV0_ADDR = registry.ABPMPV0
    ? registry.ABPMPV0.address.toLowerCase()
    : "";
}

rebuildRuntimeContracts();
activeList = ov.mergeList(list, overlay);

const contractAt = (contract) => registry[nameMap[contract]];

const contractCall = (contract, fnName, ...args) => {
  const { abi, address } = contractAt(contract);
  return call(address, abi, fnName, args);
};

let contractData = load("contractData");
let favorite = load("favorite") || {};
let loopState = load("loopState") || {
  isLooping: "false",
  interval: 60000,
  action: null,
  intervalId: null,
};

const saveLoopState = () => save("loopState", loopState);
const makeTokenId = (projId, n) =>
  projId === 0 ? n : Number((projId * 1000000 + n).toString().padStart(6, "0"));
const parseQuery = (query) => {
  const [searchQuery = "", numberQuery = ""] = query.split("#").map((s) => s.trim());
  return { searchQuery, numberQuery };
};
const isPmpDep = (d) =>
  d?.dependency_type === "ONCHAIN" &&
  (d.bytecode_address?.toLowerCase() === PMPV0_ADDR ||
    (typeof d.data === "string" && d.data.trim().startsWith("#web3call")));

const findPmpDep = (deps = []) => deps.find(isPmpDep);

function splitCollectionAndArtist(text) {
  const parts = text.split(" / ").map((s) => s.trim());
  const artist = parts.length > 0 ? parts[parts.length - 1] : "";
  const collection =
    parts.length > 1 ? parts.slice(0, -1).join(" / ") : parts[0] || "";
  return { collection, artist };
}

class ListManager {
  constructor(listData) {
    this.setList(listData);
  }

  setList(listData) {
    this.originalList = listData.filter((line) => !line.trim().endsWith("!"));
    this.reset();
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
        if (line.split(" # ").length > 1) {
          const { collection, artist } = parseListLine(line);
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
    return this.filteredList[this.selectedIndex] ?? null;
  }

  reset() {
    this.filteredList = this.originalList;
    this.selectedIndex = -1;
    return this.filteredList;
  }
}

const listManager = new ListManager(activeList);

function parseListLine(line) {
  const parts = line.split(" # ");
  const { collection, artist } = splitCollectionAndArtist(parts[1]);
  return { collection, artist, workCount: parts[parts.length - 1] };
}

function listItemHTML(line, index, numberQuery = "", selected = false) {
  const { collection, artist, workCount } = parseListLine(line);
  const displayName = numberQuery ? `${collection} #${numberQuery}` : collection;
  return `<p class="list-item ${selected ? "selected" : ""}" data-index="${index}">
           ${displayName}
           <span>${artist} - ${workCount}</span>
        </p>`;
}

function displayList(items, numberQuery = "") {
  const listItems = items
    .map((line, index) =>
      listItemHTML(line, index, numberQuery, index === listManager.selectedIndex),
    )
    .join("");

  dom.listPanel.innerHTML = `<div>${listItems}</div>`;
}

function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const newIndex = listManager.navigate(
      event.key === "ArrowUp" ? "up" : "down",
    );

    const { numberQuery } = parseQuery(dom.search.value.trim());
    displayList(listManager.filteredList, numberQuery);

    dom.listPanel
      .querySelector(`[data-index="${newIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    const selectedItem = listManager.getSelected();
    const query = dom.search.value.trim();
    if (selectedItem) {
      getToken(selectedItem, query);
    } else if (query === "curated") {
      getRandom(listManager.filteredList);
    } else if (query === "") {
      getRandom(listManager.originalList);
    } else if (listManager.filteredList.length > 0) {
      getToken(listManager.filteredList[0], query);
    }
  }
}

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
      const data = load("contractData");
      Object.assign(data, { tokenId, contract, hash, owner, ensName });

      const pmpDep = findPmpDep(data.extDep);
      if (pmpDep) {
        data.tokenParams = await fetchTokenParams(
          pmpDep.bytecode_address,
          contract,
          tokenId,
        );
      }

      save("contractData", data);
      update(data);
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
        contractCall(contract, "projectDetails", projId),
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
          [extDep, { ipfs, arweave }] = await Promise.all([
            fetchCIDs(isV3 ? "v3" : "v2", projId, extDepCount, contract),
            fetchGateway(contract),
          ]);
          if (["BMFLEX", "NUMBER"].includes(nameMap[contract])) {
            ipfs = "https://ipfs.io/ipfs";
          }
        }

        const pmpDep = findPmpDep(extDep);
        if (pmpDep) {
          tokenParams = await fetchTokenParams(
            pmpDep.bytecode_address,
            contract,
            tokenId,
          );
        }
      }

      update({
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
      });
    }
  } catch (error) {
    console.error(`grabData (${updateOnly ? "update" : "full"})`, error);
    toggleSpin(false);
  }
}

const fetchHash = (tokenId, contract) =>
  contractCall(
    contract,
    nameMap[contract] == "AB" ? "showTokenHashes" : "tokenIdToHash",
    tokenId,
  );

const fetchProjectInfo = (projId, contract, isV3) =>
  contractCall(
    contract,
    isV3 ? "projectScriptDetails" : "projectScriptInfo",
    projId,
  );

async function constructScript(projId, projectInfo, contract) {
  const scriptCount = Number(projectInfo.scriptCount);
  const batchSize = scriptCount > 30 ? 25 : scriptCount;
  let fullScript = "";

  for (let i = 0; i < scriptCount; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, scriptCount);
    const batch = await Promise.all(
      Array.from({ length: batchEnd - i }, (_, j) =>
        contractCall(contract, "projectScriptByIndex", projId, i + j),
      ),
    );
    fullScript += batch.join("");
    if (batchEnd < scriptCount) await sleep(300);
  }

  return fullScript;
}

async function fetchOwner(tokenId, contract) {
  const owner = await contractCall(contract, "ownerOf", tokenId);
  return { owner, ensName: await lookupAddress(rpcUrl, owner) };
}

function extractLibraryName([first]) {
  if (!first) return "js";
  if (typeof first === "string" && first.includes("@")) return first.trim();
  return JSON.parse(first).type;
}

async function fetchEditionInfo(projId, contract, isV3) {
  const invo = await contractCall(
    contract,
    isV3 ? "projectStateData" : "projectTokenInfo",
    projId,
  );
  return { edition: Number(invo.maxInvocations), minted: Number(invo.invocations) };
}

const fetchExtDepCount = async (projId, contract) =>
  (await contractCall(contract, "projectExternalAssetDependencyCount", projId)) ||
  null;

const fetchDependencies = (projId, extDepCount, contract) =>
  Promise.all(
    Array.from({ length: Number(extDepCount) }, (_, i) =>
      contractCall(contract, "projectExternalAssetDependencyByIndex", projId, i),
    ),
  );

const DEP_TYPES = ["IPFS", "ARWEAVE", "ART_BLOCKS_DEPENDENCY_REGISTRY"];

async function fetchCIDs(version, projId, extDepCount, contract) {
  const cidTuples = await fetchDependencies(projId, extDepCount, contract);

  if (version === "v2")
    return cidTuples.map(([cid]) => ({
      cid,
      dependency_type: "IPFS",
      data: null,
      isOnchain: false,
    }));

  return cidTuples.map((tuple) => {
    const dependencyType = Number(tuple.dependencyType || 0);

    if (dependencyType === 2) {
      let data = tuple.data || "";
      try {
        if (data.startsWith("{")) data = JSON.parse(data);
      } catch (error) {
        console.log("ONCHAIN data parsing error:", error, "Raw:", data);
      }
      return {
        cid: tuple.cid,
        dependency_type: "ONCHAIN",
        data,
        bytecode_address: tuple.bytecodeAddress || "",
        isOnchain: true,
      };
    }

    return {
      cid: tuple.cid,
      dependency_type: DEP_TYPES[dependencyType] || "IPFS",
      data: null,
      isOnchain: false,
    };
  });
}

const fetchGateway = async (contract) => {
  const [ipfs, arweave] = await Promise.all([
    contractCall(contract, "preferredIPFSGateway"),
    contractCall(contract, "preferredArweaveGateway"),
  ]);
  return { ipfs, arweave };
};

async function fetchTokenParams(pmpAddress, contract, tokenId) {
  const raw = await call(
    pmpAddress,
    contractRegistry.ABPMPV0.abi,
    "getTokenParams",
    [contractAt(contract).address, tokenId],
  ).catch(() => []);
  return Object.fromEntries(
    raw.map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]),
  );
}

function update(data) {
  const platform = getPlatform(data.contract, data.projId);
  contractData = { ...data };

  save("contractData", contractData);
  console.log(contractData);

  pushItemToLocalStorage(contractData);
  injectFrame();
  updateUI({ ...contractData, platform });
  setUIControls();
  toggleSpin(false);
}

function pushItemToLocalStorage({
  contract,
  tokenId,
  hash,
  script,
  extLib,
  extDep = [],
  ipfs,
  arweave,
  tokenParams,
}) {
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

  const tokenData = { tokenId: tokenIdStr };

  if (extDep.length) {
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

      const hasParams =
        isPmpDep(d) && tokenParams && Object.keys(tokenParams).length > 0;

      return {
        cid,
        dependency_type: type,
        data: hasParams ? tokenParams : d.isOnchain ? d.data : null,
        ...(d.bytecode_address ? { bytecode_address: d.bytecode_address } : {}),
      };
    });
    tokenData.preferredIPFSGateway = ipfs || "https://ipfs.io/ipfs/";
    tokenData.preferredArweaveGateway = arweave || "https://arweave.net/";
    tokenData.hash = hash;
  } else if (contractName === "AB") {
    tokenData.hashes = Array.isArray(hash) ? hash : [hash];
  } else {
    tokenData.hash = hash;
  }

  save("scriptData", {
    src,
    tokenIdHash: `let tokenData = ${JSON.stringify(tokenData)}`,
    process: extLib.startsWith("processing") ? "application/processing" : "",
    script,
  });
}

const replaceIPFSGateways = (scriptContent) =>
  scriptContent.replace(
    /https:\/\/(pinata\.[a-z0-9-]+\.[a-z]+|[a-z0-9-]+\.mypinata\.cloud)/g,
    "https://ipfs.io",
  );

function getPlatform(contract, projId) {
  const contractName = nameMap[contract];

  const override = platformOverrides[contractName + projId];
  if (override) return override;

  if (["AB", "ABII", "ABIII"].includes(contractName)) {
    return curated.includes(projId)
      ? "Art Blocks Curated"
      : playground.includes(projId)
        ? "Art Blocks Playground"
        : projId < 374
          ? "Art Blocks Factory"
          : "Art Blocks Presents";
  }
  if (is.studio.includes(contractName)) return "Art Blocks Studio";

  return registry[contractName].platform || "";
}

function updateUI({
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
}) {
  const infoText = `${detail[0]} #${shortId(tokenId)}${detail[1] ? ` / ${detail[1]}` : ""}`;
  dom.info.innerHTML = "";
  dom.info.classList.remove("scrolling");

  const spanElement = document.createElement("span");
  spanElement.textContent = infoText;
  dom.info.appendChild(spanElement);

  if (spanElement.offsetWidth > dom.info.offsetWidth) {
    const scrollDuration = spanElement.offsetWidth / 30;
    dom.info.style.setProperty("--scroll-duration", `${scrollDuration}s`);
    const duplicateSpan = spanElement.cloneNode(true);
    duplicateSpan.setAttribute("aria-hidden", "true");
    dom.info.appendChild(duplicateSpan);
    dom.info.classList.add("scrolling");
  }

  const showLib =
    extLib &&
    !["js", "svg", "custom"].some((prefix) => extLib.startsWith(prefix));
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

  const copyLink = (title, href, label, copyText = href) =>
    createSection(
      title,
      `<a href="${href}" target="_blank">${label}</a>
       <span class="copy-txt" data-text="${copyText}">
         <i class="fa-regular fa-copy"></i>
       </span>`,
    );
  const copyVal = (title, val) =>
    createSection(
      title,
      `<span class="copy-txt" data-text="${val}">${val} <i class="fa-regular fa-copy"></i></span>`,
    );
  const plain = (title, val) =>
    val ? createSection(title, `<span class="no-copy-txt">${val}</span>`) : "";

  const { address } = contractAt(contract);

  dom.panel.innerHTML = `
     <div class="work">${detail[0]}</div>
     <p>
       <span class="artist">${detail[1]}${platform ? ` &bull; ${platform}` : ""}</span><br>
       <span class="edition">${editionTxt(edition, minted)}</span>
     </p>
     <p>${detail[2]}</p>
     <div class="column-box">
       <div class="column">
         ${
           owner
             ? copyLink(
                 "OWNER",
                 `https://opensea.io/profile/${owner}`,
                 ensName || shortAddr(owner),
                 owner,
               )
             : ""
         }
         ${copyLink("CONTRACT", `https://etherscan.io/address/${address}`, shortAddr(address))}
         ${copyVal("TOKEN ID", tokenId)}
       </div>
       <div class="column">
         ${
           detail[3]
             ? createSection(
                 "ARTIST WEBSITE",
                 `<a href="${detail[3]}" target="_blank">${extractDomain(detail[3])}</a>`,
               )
             : ""
         }
         ${plain("DEPENDENCY", dependencyInfo)}
         ${plain("LICENSE", detail[4])}
       </div>
     </div>
   `;
}

function shortId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0;
}

const shortAddr = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

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
  return match ? `${match[1]}${match[2] || ""}` : url;
}

function getLibVersion(extLib) {
  return (
    Object.keys(libs).find((key) =>
      key.startsWith(extLib.replace(/js$/, "") + "@"),
    ) || extLib
  );
}

function showExtDep(dependency) {
  return (
    dependency &&
    !["ONCHAIN", "ART_BLOCKS_DEPENDENCY_REGISTRY"].includes(
      dependency.dependency_type,
    )
  );
}

function getExtDepType(dependency, contract) {
  if (nameMap[contract] === "BMFLEX") return "ipfs";
  const isIPFS =
    dependency.dependency_type === "IPFS" ||
    (dependency.cid &&
      (dependency.cid.startsWith("Qm") || dependency.cid.startsWith("baf")));
  return isIPFS ? "ipfs" : "arweave";
}

function injectFrame() {
  try {
    const { src = [], tokenIdHash, process, script } = load("scriptData");
    const { extLib } = contractData;

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

    const canvasAndScript = process
      ? `<script type="${process}">${script}</script><canvas></canvas>`
      : `<canvas${extLib.startsWith("babylon") ? ' id="babylon-canvas"' : ""}></canvas><script${hasThree167 ? ' type="module"' : ""}>${script}</script>`;

    dom.frame.srcdoc = extLib.startsWith("custom")
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
            ${canvasAndScript}
          </body>
        </html>`;
  } catch (error) {
    console.error("injectFrame:", error);
  }
}

function getToken(line, searchQuery) {
  const match = line.match(/^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*Work/);
  if (!match) return;

  const [, listContract, projIdStr, tokenStr] = match;
  const contract = indexMap[listContract];

  if (contract === undefined) {
    console.error(`Unknown contract in collection line: ${listContract}`);
    return;
  }

  const numberMatch = searchQuery.match(/#\s*(\d+)/);
  const pick = numberMatch
    ? parseInt(numberMatch[1])
    : Math.floor(Math.random() * parseInt(tokenStr));

  grabData(makeTokenId(parseInt(projIdStr), pick), contract);
  dom.search.value = "";
  listManager.reset();
  displayList(listManager.originalList);
}

function getRandom(source) {
  if (Array.isArray(source)) {
    getToken(source[Math.floor(Math.random() * source.length)], "");
  } else if (typeof source === "object" && Object.keys(source).length > 0) {
    const keys = Object.keys(source);
    clearDataStorage();
    contractData = source[keys[Math.floor(Math.random() * keys.length)]];
    update(contractData);
  }
}

function generateRandomHashAndToken() {
  const hash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const base = contractData.projId * 1000000;
  const minToken = base + contractData.minted;
  const maxToken = base + 999999;
  const tokenId = Math.floor(
    Math.random() * (maxToken - minToken + 1) + minToken,
  );
  return { hash, tokenId };
}

function exploreAlgo() {
  if (contractData.detail[0] === "Unigrids") return;
  Object.assign(contractData, generateRandomHashAndToken(), {
    owner: "",
    ensName: "",
  });
  update(contractData);
}

function stepTokenId(dir) {
  const max = contractData.minted - 1;
  const numericId = contractData.tokenId % 1000000;
  const next =
    dir > 0
      ? numericId === max ? 0 : numericId + 1
      : numericId === 0 ? max : numericId - 1;
  contractData.tokenId = contractData.projId * 1000000 + next;
  grabData(contractData.tokenId, contractData.contract, true);
}

const loopActions = {
  allLoop: () => getRandom(listManager.originalList),
  favLoop: () => getRandom(favorite),
  curatedLoop: () => {
    listManager.filterByQuery("curated");
    getRandom(listManager.filteredList);
  },
  selectedLoop: () => {
    const projectLine = listManager.originalList.find(
      (line) => parseListLine(line).collection.trim() === contractData.detail[0],
    );
    getToken(projectLine, "");
  },
  oobLoop: exploreAlgo,
};

function performAction(action) {
  clearPanels();
  loopActions[action]?.();
}

function loopRandom(interval, action) {
  if (loopState.intervalId) clearInterval(loopState.intervalId);

  if (loopState.isLooping !== "true") performAction(action);

  const intervalId = setInterval(() => performAction(action), interval);
  loopState = { isLooping: "true", interval, action, intervalId };
  saveLoopState();
}

function stopLoop() {
  if (loopState.intervalId) clearInterval(loopState.intervalId);
  loopState.isLooping = "false";
  saveLoopState();
  updateLoopButton();
}

function checkLoop() {
  dom.loopInput.placeholder = `${loopState.interval / 60000} min`;
  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action);
}

function handleLoop(action) {
  const inputValue = dom.loopInput.value.trim();
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
    loopState = { isLooping: "false", interval, action };
    saveLoopState();
  }
  updateLoopButton();
}

function saveOutput() {
  const content = dom.frame.contentDocument.documentElement.outerHTML;
  const id = shortId(contractData.tokenId);
  const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${contractData.detail[0].replace(/\s+/g, "-")}#${id}.html`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(url);
  link.remove();
  pushFavoriteToStorage(id);
}

function pushFavoriteToStorage(id) {
  favorite[`
    <div class="fav-item">
      ${contractData.detail[0]} #${id}
      <span>${contractData.detail[1]}</span>
    </div>`] = contractData;
  save("favorite", favorite);
  setUIControls();
}

function deleteFavoriteFromStorage(key) {
  if (!(key in favorite)) return;
  delete favorite[key];
  save("favorite", favorite);
  setUIControls(true);
}

function displayFavoriteList() {
  dom.favPanel.innerHTML = "";

  Object.keys(favorite).forEach((key) => {
    const keyElement = document.createElement("p");
    keyElement.style.cssText =
      "display:flex; justify-content:space-between; align-items:center";

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
      clearDataStorage();
      contractData = favorite[key];
      update(contractData);
      clearPanels();
    });

    keyElement.insertAdjacentHTML("afterbegin", key);
    keyElement.appendChild(delSpan);
    dom.favPanel.appendChild(keyElement);
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clearDataStorage = () =>
  ["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d));

const clearPanels = () =>
  [dom.overlay, dom.infobar, ...panels].forEach((el) =>
    el.classList.remove("active"),
  );

const togglePanel = (panelElement) => {
  panels.forEach((p) =>
    p !== panelElement ? p.classList.remove("active") : (p.scrollTop = 0),
  );

  const isActive = panelElement.classList.toggle("active");
  [dom.overlay, dom.infobar].forEach((el) =>
    el.classList.toggle("active", isActive),
  );
};

const bindPanelToggle = (el, panel, before) => {
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    before?.();
    togglePanel(panel);
  });
};

const alignFavMenu = () => {
  if (window.matchMedia("(max-width: 600px)").matches) {
    dom.favMenu.style.left = "";
    dom.favMenu.style.right = "";
    return;
  }

  const { right } = dom.favIcon.getBoundingClientRect();
  dom.favMenu.style.left = `${Math.max(10, right + 25 - dom.favMenu.offsetWidth)}px`;
  dom.favMenu.style.right = "auto";
};

const toggleSpin = (show = true) => {
  dom.spinner.style.display = show ? "block" : "none";
};

const updateLoopButton = () => {
  const looping = loopState.isLooping === "true";
  $(".fa-repeat").style.display = looping ? "none" : "inline-block";
  $(".fa-circle-stop").style.display = looping ? "inline-block" : "none";
};

const setUIControls = (skipOverlay = false) => {
  const hasContract = !!contractData;
  const hasRPC = !!rpcUrl;
  const hasFavorites = Object.keys(favorite).length > 0;

  dom.infobar.style.opacity = !hasRPC || !hasContract ? "0.9" : "";

  [dom.inc, dom.dec, dom.info, dom.explore, dom.loop].forEach(
    (button) => (button.style.display = hasContract ? "block" : "none"),
  );

  dom.instruction.classList.toggle("active", !hasRPC);
  if (!skipOverlay) dom.overlay.classList.toggle("active", !hasRPC);

  dom.favSave.disabled = !hasContract;
  dom.favOpen.disabled = !hasFavorites;
  dom.favIcon.style.display = hasContract || hasFavorites ? "block" : "none";
  if (!hasFavorites && hasRPC) clearPanels();
};

let listEdit = null;
let contractEditKey = null;
let listManageEntries = [];
let contractManageEntries = [];
let updateResults = [];
let updateRunning = false;
let contractSectionOpen = false;
const exposedContracts = new Set();

const escapeHTML = (value) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const setManageStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle("error", isError);
};

const persistOverlay = () => {
  const saved = ov.saveOverlay(overlay);
  if (!saved) {
    setManageStatus(
      dom.collectionStatus,
      "Could not save changes in this browser.",
      true,
    );
  }
  return saved;
};

const fail = (element, message) => {
  setManageStatus(element, message, true);
  return false;
};

const lineFromParsed = (parsed, works = parsed.works) =>
  ov.makeListLine({ ...parsed, works });

const manageButton = (action, label, attr = "data-action", extra = "") =>
  `<button type="button" class="manage-btn${
    extra ? ` ${extra}` : ""
  }" ${attr}="${action}">${label}</button>`;

function commitChanges(statusElement, message, { contracts = false } = {}) {
  if (!persistOverlay()) return false;
  refreshLibrary({ contracts });
  setManageStatus(statusElement, message);
  return true;
}

function refreshWindowContractNames() {
  exposedContracts.forEach((name) => {
    if (!registry[name]) {
      delete window[name.toLowerCase()];
      exposedContracts.delete(name);
    }
  });

  Object.keys(registry).forEach((name) => {
    window[name.toLowerCase()] = name;
    exposedContracts.add(name);
  });
}

function populateManagementSelects() {
  const selectedAbi = dom.contractAbi.value;
  dom.contractAbi.innerHTML = Object.keys(abiProfiles)
    .filter((name) => !["PMPV0", "bm", "v1"].includes(name))
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");

  dom.contractAbi.value =
    selectedAbi && abiProfiles[selectedAbi] ? selectedAbi : "v3Flex";
}

function refreshLibrary({ contracts = false } = {}) {
  if (contracts) {
    const activeContractName = contractData
      ? nameMap[contractData.contract]
      : null;
    rebuildRuntimeContracts();
    populateManagementSelects();
    refreshWindowContractNames();

    if (contractData && activeContractName) {
      const index = indexMap[activeContractName];
      if (index === undefined) {
        clearDataStorage();
        contractData = null;
        setUIControls();
      } else {
        contractData.contract = index;
        save("contractData", contractData);
      }
    }
  }

  activeList = ov.mergeList(list, overlay);
  listManager.setList(activeList);

  if (dom.listPanel.classList.contains("active")) {
    const { searchQuery, numberQuery } = parseQuery(dom.search.value.trim());
    displayList(
      searchQuery
        ? listManager.filterByQuery(searchQuery)
        : listManager.originalList,
      searchQuery ? numberQuery : "",
    );
  }

  renderManageList();
  renderManageContracts();
}

function renderManageList() {
  const entries = ov
    .listEntries(list, overlay)
    .filter((entry) => entry.kind !== "base");

  listManageEntries = entries;

  if (entries.length === 0) {
    dom.manageListRows.innerHTML =
      '<p class="manage-status">No local changes yet.</p>';
    return;
  }

  dom.manageListRows.innerHTML = entries
    .map((entry, index) => {
      const hidden =
        entry.kind === "removed" || ov.parseListLine(entry.line)?.hidden;
      const actions = hidden
        ? manageButton("unhide", "Unhide")
        : `${manageButton("edit", "Edit")}${manageButton("hide", "Hide")}`;

      return `<div class="manage-item ${
        entry.kind === "removed" ? "removed" : hidden ? "hidden" : ""
      }" data-entry-index="${index}">
        <p class="manage-item-main">${escapeHTML(entry.line)}</p>
        <div class="manage-item-actions">
          <span class="manage-badge">${entry.kind}</span>
          ${actions}
        </div>
      </div>`;
    })
    .join("");
}

function contractAbiName(key) {
  return (
    overlay.contracts[key]?.abi ||
    Object.keys(abiProfiles).find(
      (name) => abiProfiles[name] === registry[key]?.abi,
    ) ||
    ""
  );
}

const contractKind = (key) => {
  if (!baseContractRegistry[key]) return "custom";
  return overlay.contracts[key] ? "overridden" : "bundled";
};

function renderManageContracts() {
  const keys = Object.keys(registry).filter(
    (key) => !frozenContracts.has(key) && contractKind(key) !== "bundled",
  );

  contractManageEntries = keys;

  dom.contractSection.hidden = keys.length === 0;
  dom.contractSectionLabel.textContent = `Contracts (${keys.length})`;

  dom.manageContractRows.innerHTML = keys
    .map((key, index) => {
      const config = registry[key];
      const kind = contractKind(key);

      return `<div class="manage-item" data-contract-index="${index}">
        <p class="manage-item-main">${key}
          <span class="manage-badge">${kind}</span>
        </p>
        <p class="manage-item-main">${contractAbiName(key)} &bull; ${shortAddr(
          config.address,
        )}${config.platform ? ` &bull; ${escapeHTML(config.platform)}` : ""}${
          config.startProjId !== undefined
            ? ` &bull; start ${config.startProjId}`
            : ""
        }</p>
        <div class="manage-item-actions">
          ${manageButton("edit", "Edit")}
          ${manageButton("remove", kind === "custom" ? "Remove" : "Restore")}
        </div>
      </div>`;
    })
    .join("");
}

function resetCollectionForm() {
  listEdit = null;
  dom.collectionForm.reset();
  dom.collectionTarget.textContent = "Edit collection";
}

function setCollectionFormOpen(open) {
  dom.collectionForm.hidden = !open;
  if (open) setManageStatus(dom.collectionStatus, "");
  else resetCollectionForm();
}

function resetContractForm() {
  contractEditKey = null;
  dom.contractForm.reset();
  dom.contractKey.disabled = false;
  dom.contractAbi.value = "v3Flex";
}

function setContractFormOpen(open) {
  dom.contractForm.hidden = !open;
  dom.contractToggle.textContent = open ? "Cancel" : "+ Add contract";
  if (open) setManageStatus(dom.contractStatus, "");
  else resetContractForm();
}

function setContractSectionOpen(open) {
  contractSectionOpen = open;
  dom.manageContractRows.hidden = !open;
  dom.contractSectionToggle.setAttribute("aria-expanded", String(open));
  dom.contractSectionIcon.classList.toggle("fa-chevron-up", open);
  dom.contractSectionIcon.classList.toggle("fa-chevron-down", !open);
}

function startListEdit(entry) {
  const parsed = ov.parseListLine(entry.line);
  if (!parsed) return;

  listEdit = {
    parsed,
    original: entry.original,
    additionLine: entry.kind === "added" ? entry.line : null,
  };

  setCollectionFormOpen(true);
  dom.collectionTarget.textContent = `Edit ${parsed.contract}${parsed.projectId}`;
  dom.collectionName.value = parsed.collection;
  dom.collectionArtist.value = parsed.artist;
  dom.collectionWorks.value = parsed.works;
  dom.collectionForm.scrollIntoView({ block: "nearest" });
}

function startContractEdit(key) {
  const config = registry[key];
  if (!config) return;

  setContractFormOpen(true);
  contractEditKey = key;
  dom.contractKey.value = key;
  dom.contractKey.disabled = true;
  dom.contractAbi.value = contractAbiName(key);
  dom.contractAddress.value = config.address;
  dom.contractPlatform.value = config.platform || "";
  dom.contractStart.value = config.startProjId ?? "";
  setManageStatus(dom.contractStatus, `Editing ${key}.`);
  dom.contractForm.scrollIntoView({ block: "nearest" });
}

function renderUpdateResults() {
  if (updateResults.length === 0) {
    dom.manageUpdateResults.innerHTML = "";
    return;
  }

  const limit = 200;
  const rows = updateResults
    .slice(0, limit)
    .map((result, index) => {
      const isNew = result.kind === "new";
      const badge = isNew
        ? `<span class="manage-badge">new</span>`
        : `<span class="manage-badge">${result.oldWorks} &rarr; ${result.newWorks} works</span>`;

      return `<div class="manage-item" data-update-index="${index}">
        <p class="manage-item-main">${escapeHTML(result.line)}</p>
        <div class="manage-item-actions">
          ${badge}
          ${manageButton("apply", isNew ? "Add" : "Update", "data-update-action")}
          ${manageButton("dismiss", "Dismiss", "data-update-action")}
        </div>
      </div>`;
    })
    .join("");

  const more =
    updateResults.length > limit
      ? `<p class="manage-status">Showing first ${limit} of ${updateResults.length}. Use apply all to review everything.</p>`
      : "";
  const kinds = new Set(updateResults.map((result) => result.kind));
  const applyLabel =
    kinds.size > 1 ? "Apply all" : kinds.has("new") ? "Add all" : "Update all";

  dom.manageUpdateResults.innerHTML = `${rows}${more}
    <div class="manage-row">
      ${manageButton(
        "apply-all",
        `${applyLabel} (${updateResults.length})`,
        "data-update-action",
        "primary",
      )}
    </div>`;
}

function knownListIdentities() {
  const known = new Set();
  const remember = (line) => {
    const identity = ov.listIdentity(line);
    if (identity) known.add(identity);
  };

  list.forEach(remember);
  overlay.list.forEach((change) => {
    if (change.line) remember(change.line);
    if (change.original) remember(change.original);
  });

  return known;
}

function currentLibraryEntries() {
  const entries = new Map();
  ov.listEntries(list, overlay).forEach((entry) => {
    if (entry.kind === "removed") return;
    const identity = ov.listIdentity(entry.line);
    if (identity) entries.set(identity, entry);
  });
  return entries;
}

function compareProjectLine(line, currentEntries) {
  const identity = ov.listIdentity(line);
  if (!identity) return null;

  const current = currentEntries.get(identity);
  if (!current) return { kind: "new", identity, line };

  const currentParsed = ov.parseListLine(current.line);
  const nextParsed = ov.parseListLine(line);
  if (!currentParsed || !nextParsed || currentParsed.works === nextParsed.works) {
    return null;
  }

  return {
    kind: "changed",
    identity,
    line: lineFromParsed(currentParsed, nextParsed.works),
    original: current.original,
    previousLine: current.line,
    added: current.kind === "added",
    oldWorks: currentParsed.works,
    newWorks: nextParsed.works,
  };
}

function applyUpdateResult(result) {
  if (result.kind === "new") return ov.applyAdd(overlay, result.line);
  if (result.added) return ov.applyAdd(overlay, result.line, result.previousLine);
  return ov.applyEdit(overlay, result.original, result.line);
}

const countKind = (results, kind) =>
  results.filter((result) => result.kind === kind).length;

async function scanContract(name, known, currentEntries, onProgress) {
  const results = [];

  await fetchProjectLines(name, {
    onLine: (line) => {
      const result = compareProjectLine(line, currentEntries);
      if (!result) return;
      if (result.kind === "new") {
        if (known.has(result.identity)) return;
        known.add(result.identity);
      }
      results.push(result);
    },
    onProgress: (progress) => onProgress?.({ ...progress, results }),
  });

  return results;
}

async function updateAllContracts() {
  if (!rpcUrl) {
    setManageStatus(dom.updateStatus, "Set an RPC URL first.", true);
    return;
  }
  if (updateRunning) return;

  updateRunning = true;
  dom.manageUpdate.disabled = true;
  updateResults = [];
  renderUpdateResults();
  setManageStatus(dom.updateStatus, "Checking active contracts...");

  const known = knownListIdentities();
  const currentEntries = currentLibraryEntries();
  const contracts = Object.keys(registry).filter(
    (key) => !frozenContracts.has(key),
  );
  let failed = 0;

  try {
    for (const [i, key] of contracts.entries()) {
      setManageStatus(
        dom.updateStatus,
        `Checking ${key} (${i + 1}/${contracts.length})...`,
      );

      try {
        const results = await scanContract(
          key,
          known,
          currentEntries,
          ({ scanned, total, results }) => {
            const parts = [
              [countKind(results, "new"), "new"],
              [countKind(results, "changed"), "changed"],
            ]
              .filter(([count]) => count)
              .map(([count, label]) => `${count} ${label}`);
            setManageStatus(
              dom.updateStatus,
              `${key}: ${scanned}/${total} checked${
                parts.length ? ` (${parts.join(", ")})` : ""
              }...`,
            );
          },
        );
        updateResults.push(...results);
      } catch (error) {
        failed += 1;
        console.warn(`Update failed for ${key}:`, error);
      }

      await sleep(50);
    }

    renderUpdateResults();

    const suffix = failed
      ? ` ${failed} contract(s) could not be checked.`
      : "";
    const newCount = countKind(updateResults, "new");
    const changedCount = countKind(updateResults, "changed");

    if (newCount === 0 && changedCount === 0) {
      setManageStatus(
        dom.updateStatus,
        `No new collections or artwork count changes.${suffix}`,
      );
      return;
    }

    const parts = [];
    if (newCount) parts.push(`${newCount} new collection(s)`);
    if (changedCount) parts.push(`${changedCount} artwork count change(s)`);
    setManageStatus(
      dom.updateStatus,
      `Found ${parts.join(" and ")}. Review them below.${suffix}`,
    );
  } finally {
    updateRunning = false;
    dom.manageUpdate.disabled = false;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

function bindCopyButton(button, getText, statusElement, okMessage, failMessage) {
  button.addEventListener("click", async () => {
    const copied = await copyText(getText());
    setManageStatus(statusElement, copied ? okMessage : failMessage, !copied);
  });
}

function initLibraryManager() {
  populateManagementSelects();
  refreshWindowContractNames();
  renderManageList();
  renderManageContracts();
  setCollectionFormOpen(false);
  setContractFormOpen(false);

  bindPanelToggle(dom.manage, dom.managePanel, () => {
    renderManageList();
    renderManageContracts();
  });

  dom.manageClose.addEventListener("click", (event) => {
    event.stopPropagation();
    clearPanels();
  });

  dom.manageUpdate.addEventListener("click", updateAllContracts);

  dom.manageUpdateResults.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-update-action]");
    if (!button) return;
    const action = button.dataset.updateAction;

    if (action === "apply-all") {
      if (updateResults.length === 0) return;
      const results = updateResults;
      updateResults = [];
      results.forEach(applyUpdateResult);
      commitChanges(dom.updateStatus, `Applied ${results.length} change(s).`);
      renderUpdateResults();
      return;
    }

    const row = button.closest("[data-update-index]");
    const result = updateResults[Number(row?.dataset.updateIndex)];
    if (!result) return;

    updateResults.splice(Number(row.dataset.updateIndex), 1);
    if (action === "apply") {
      applyUpdateResult(result);
      commitChanges(
        dom.updateStatus,
        result.kind === "new" ? "Collection added." : "Artwork count updated.",
      );
    }
    renderUpdateResults();
  });

  dom.contractSectionToggle.addEventListener("click", () => {
    setContractSectionOpen(!contractSectionOpen);
  });

  dom.contractToggle.addEventListener("click", () => {
    setContractFormOpen(dom.contractForm.hidden);
    setManageStatus(dom.contractStatus, "");
  });

  dom.manageListRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const row = button?.closest("[data-entry-index]");
    const entry = listManageEntries[Number(row?.dataset.entryIndex)];
    if (!entry) return;

    const action = button.dataset.action;

    if (action === "edit") {
      startListEdit(entry);
    } else if (action === "hide") {
      if (entry.kind === "added") {
        if (listEdit?.additionLine === entry.line) setCollectionFormOpen(false);
        ov.hideAddition(overlay, entry.line);
      } else {
        if (listEdit?.original === entry.original) setCollectionFormOpen(false);
        ov.applyRemove(overlay, entry.original);
      }
      commitChanges(
        dom.collectionStatus,
        "Collection hidden. It stays here so you can unhide it.",
      );
    } else if (action === "unhide") {
      if (entry.kind === "removed") ov.restoreOriginal(overlay, entry.original);
      else ov.unhideAddition(overlay, entry.line);
      commitChanges(
        dom.collectionStatus,
        "Collection unhidden. It is back in the library.",
      );
    }
  });

  dom.collectionCancel.addEventListener("click", () => {
    setCollectionFormOpen(false);
    setManageStatus(dom.collectionStatus, "");
  });

  dom.collectionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!listEdit)
      return fail(dom.collectionStatus, "Choose a collection to edit.");

    const collection = dom.collectionName.value.trim();
    const artist = dom.collectionArtist.value.trim();
    const works = Number(dom.collectionWorks.value);

    if (!collection)
      return fail(dom.collectionStatus, "Enter a collection name.");
    if (!Number.isInteger(works) || works < 0)
      return fail(dom.collectionStatus, "Enter a valid work count.");

    const line = lineFromParsed({ ...listEdit.parsed, collection, artist }, works);

    if (!ov.parseListLine(line))
      return fail(dom.collectionStatus, "Contract keys must be letters only.");

    if (listEdit.additionLine) {
      ov.applyAdd(overlay, line, listEdit.additionLine);
    } else {
      ov.applyEdit(overlay, listEdit.original, line);
    }

    if (commitChanges(dom.collectionStatus, "Collection saved."))
      setCollectionFormOpen(false);
  });

  dom.manageContractRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const row = button?.closest("[data-contract-index]");
    const key = contractManageEntries[Number(row?.dataset.contractIndex)];
    if (!key) return;

    const action = button.dataset.action;

    if (action === "edit") {
      startContractEdit(key);
    } else if (action === "remove") {
      const kind = contractKind(key);
      if (!confirm(`Remove ${key} from your overlay?`)) return;

      delete overlay.contracts[key];
      if (contractEditKey === key) setContractFormOpen(false);
      commitChanges(
        dom.contractStatus,
        kind === "custom" ? "Contract removed." : "Bundled contract restored.",
        { contracts: true },
      );
    }
  });

  dom.contractCancel.addEventListener("click", () => {
    setContractFormOpen(false);
    setManageStatus(dom.contractStatus, "");
  });

  dom.contractKey.addEventListener("input", () => {
    const key = dom.contractKey.value.trim().toUpperCase();
    if (!contractEditKey && registry[key])
      fail(
        dom.contractStatus,
        `${key} is already used. Edit it or choose a different key.`,
      );
    else setManageStatus(dom.contractStatus, "");
  });

  dom.contractForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const key = (contractEditKey || dom.contractKey.value.trim()).toUpperCase();
    if (!/^[A-Z]+$/.test(key))
      return fail(dom.contractStatus, "Contract keys must contain letters only.");
    if (!contractEditKey && registry[key])
      return fail(
        dom.contractStatus,
        `${key} is already used. Edit it or choose a different key.`,
      );

    const abi = dom.contractAbi.value;
    if (!abiProfiles[abi])
      return fail(dom.contractStatus, "Choose a valid ABI.");

    const config = ov.normalizeContractConfig({
      abi,
      address: dom.contractAddress.value,
      platform: dom.contractPlatform.value,
      startProjId: dom.contractStart.value,
    });

    if (!config)
      return fail(
        dom.contractStatus,
        "Enter a valid 0x address and start project ID.",
      );

    const message = contractEditKey
      ? "Contract updated."
      : 'Contract added. Press "Update list" to fetch its collections.';
    overlay.contracts[key] = config;
    if (commitChanges(dom.contractStatus, message, { contracts: true }))
      setContractFormOpen(false);
  });

  bindCopyButton(
    dom.manageCopyList,
    () => ov.exportListJS(list, overlay, Object.keys(registry)),
    dom.copyStatus,
    "Full list JS copied. Paste into js/data.js.",
    "Could not copy the list.",
  );

  bindCopyButton(
    dom.manageCopyContracts,
    () => ov.exportContractsJS(overlay),
    dom.copyStatus,
    "Contract JS copied. Paste into js/constants.js.",
    "Could not copy the contracts.",
  );

  dom.manageReset.addEventListener("click", () => {
    if (!confirm("Remove all local collection and contract changes?")) return;

    overlay = ov.emptyOverlay();
    persistOverlay();
    refreshLibrary({ contracts: true });
    setCollectionFormOpen(false);
    setContractFormOpen(false);
    updateResults = [];
    renderUpdateResults();
    [dom.collectionStatus, dom.contractStatus, dom.updateStatus].forEach(
      (element) => setManageStatus(element, ""),
    );
    setManageStatus(dom.copyStatus, "Local changes cleared.");
  });
}

const tooltipTexts = {
  info: "More Info",
  settings: "Settings",
  repeatIcon: "Loop Through Artworks",
  stopLoop: "Stop Loop",
  dec: "Previous Artwork",
  inc: "Next Artwork",
  explore: "Explore Algo",
  randomButton: "Random Artwork",
  searchIcon: "Search Collections",
  favIcon: "Save or Open Favorites",
};

let tooltipTimeout = null;

function showTooltip(element, text) {
  clearTimeout(tooltipTimeout);

  tooltipTimeout = setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const infobarRect = dom.infobar.getBoundingClientRect();

    dom.tooltip.textContent = text;
    dom.tooltip.style.visibility = "hidden";
    dom.tooltip.classList.add("active");

    const { width } = dom.tooltip.getBoundingClientRect();
    const leftPos = Math.max(
      10 + width / 2,
      Math.min(window.innerWidth - 10 - width / 2, rect.left + rect.width / 2),
    );

    Object.assign(dom.tooltip.style, {
      left: `${leftPos}px`,
      bottom: `${window.innerHeight - infobarRect.top + 10}px`,
      color: "var(--color-btn)",
      transform: "translateX(-50%)",
      visibility: "visible",
    });
  }, 500);
}

function hideTooltip() {
  clearTimeout(tooltipTimeout);
  tooltipTimeout = null;
  dom.tooltip.classList.remove("active");
  dom.tooltip.style.visibility = "";
  dom.tooltip.style.opacity = "";
}

function initTooltips() {
  Object.entries(tooltipTexts).forEach(([key, text]) => {
    const element = dom[key];
    if (!element) return;
    element.addEventListener("mouseenter", () => showTooltip(element, text));
    element.addEventListener("mouseleave", hideTooltip);
    element.addEventListener("click", hideTooltip);
  });
}

function setTheme(themeName) {
  dom.themeBtns.forEach((btn) =>
    btn.setAttribute("data-active", btn.dataset.theme === themeName),
  );
  const dark =
    themeName === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : themeName === "dark";
  dom.root.classList.toggle("dark-mode", dark);
  localStorage.setItem("themePreference", themeName);
}

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearDataStorage();
    location.reload();
  }
});

dom.rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key !== "Enter") return;
  const value = dom.rpcUrlInput.value.trim();

  if (value === "") localStorage.removeItem("rpcUrl");
  else localStorage.setItem("rpcUrl", value);

  location.reload();
});

dom.search.addEventListener("input", (event) => {
  const query = event.target.value.trim();
  const openList = () => {
    if (!dom.listPanel.classList.contains("active")) togglePanel(dom.listPanel);
  };

  if (query.startsWith("#") && contractData) {
    const num = query.substring(1);
    const originalLine = /^\d*$/.test(num)
      ? listManager.originalList.find((line) =>
          line.includes(contractData.detail[0]),
        )
      : null;

    if (!originalLine) return clearPanels();

    listManager.filteredList = [originalLine];
    listManager.selectedIndex = 0;
    dom.listPanel.innerHTML = `<div>${listItemHTML(originalLine, 0, num, true)}</div>`;
    openList();
    return;
  }

  const { searchQuery, numberQuery } = parseQuery(query);
  if (searchQuery === "") return clearPanels();

  displayList(listManager.filterByQuery(searchQuery), numberQuery);
  openList();
});

dom.search.addEventListener("keydown", handleKeyboardNavigation);

dom.listPanel.addEventListener("click", (event) => {
  const listItem = event.target.closest(".list-item");
  if (!listItem) return;
  listManager.selectedIndex = parseInt(listItem.dataset.index);
  const selectedItem = listManager.getSelected();
  if (selectedItem) getToken(selectedItem, dom.search.value.trim());
});

bindPanelToggle(dom.settings, dom.instruction);
bindPanelToggle(dom.info, dom.panel);
bindPanelToggle(dom.searchIcon, dom.listPanel, () =>
  displayList(listManager.originalList),
);
bindPanelToggle(dom.favIcon, dom.favMenu, alignFavMenu);
bindPanelToggle(dom.favOpen, dom.favPanel, displayFavoriteList);
bindPanelToggle(dom.repeatIcon, dom.dropMenu);

window.addEventListener("resize", () => {
  if (dom.favMenu.classList.contains("active")) alignFavMenu();
});

dom.favSave.addEventListener("click", () => {
  saveOutput();
  clearPanels();
});

loopTypes.forEach((type) => {
  dom[`${type}Loop`].addEventListener("click", () => handleLoop(`${type}Loop`));
});

dom.stopLoop.addEventListener("click", stopLoop);
dom.inc.addEventListener("click", () => stepTokenId(1));
dom.dec.addEventListener("click", () => stepTokenId(-1));
dom.randomButton.addEventListener("click", () =>
  getRandom(listManager.originalList),
);
dom.explore.addEventListener("click", exploreAlgo);

panels.forEach((panel) => {
  panel.addEventListener("click", (event) => event.stopPropagation());
});

dom.panel.addEventListener("click", (event) => {
  const copyBtn = event.target.closest(".copy-txt");
  if (!copyBtn) return;

  copyText(copyBtn.dataset.text);

  const icon = copyBtn.querySelector("i");
  icon.classList.replace("fa-regular", "fa-solid");
  icon.classList.replace("fa-copy", "fa-check");

  setTimeout(() => {
    icon.classList.replace("fa-solid", "fa-regular");
    icon.classList.replace("fa-check", "fa-copy");
  }, 1000);
});

document.addEventListener("click", clearPanels);

dom.themeBtns.forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.theme));
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (event) => {
    if (localStorage.getItem("themePreference") === "system") {
      dom.root.classList.toggle("dark-mode", event.matches);
    }
  });

updateLoopButton();
checkLoop();
setUIControls();
initTooltips();
setTheme(localStorage.getItem("themePreference") || "system");
initLibraryManager();
if (contractData) update(contractData);
dom.root.classList.remove("no-flash");

const FETCH_BATCH_SIZE = 10;
const FETCH_BATCH_DELAY = 2000;

async function fetchProjectLines(contractName, { onLine, onProgress } = {}) {
  if (!registry[contractName]) {
    throw new Error(`Unknown contract: ${contractName}`);
  }

  const n = indexMap[contractName];
  const start = registry[contractName].startProjId || 0;
  const end = Number(await contractCall(n, "nextProjectId"));
  const ids = Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
  const stateFn = is.v3.includes(contractName)
    ? "projectStateData"
    : "projectTokenInfo";

  for (let offset = 0; offset < ids.length; offset += FETCH_BATCH_SIZE) {
    const batchIds = ids.slice(offset, offset + FETCH_BATCH_SIZE);
    const results = await Promise.all(
      batchIds.map(async (id) => {
        try {
          const detail = await contractCall(n, "projectDetails", id.toString());
          const token = await contractCall(n, stateFn, id);
          return [detail, token];
        } catch {
          return null;
        }
      }),
    );

    results.forEach((result, idx) => {
      if (!result) return;
      const [detail, token] = result;
      const noun = Number(token.invocations) === 1 ? "Work" : "Works";
      onLine?.(
        `${contractName}${batchIds[idx]} # ${detail[0]} / ${detail[1]} # ${token.invocations} ${noun}`,
      );
    });

    onProgress?.({
      scanned: offset + batchIds.length,
      total: ids.length,
    });

    if (offset + FETCH_BATCH_SIZE < ids.length) await sleep(FETCH_BATCH_DELAY);
  }
}

async function blocks(contractNames) {
  const known = knownListIdentities();
  const currentEntries = currentLibraryEntries();

  for (const contractName of contractNames) {
    const results = await scanContract(contractName, known, currentEntries);
    const newBlocks = results.filter((result) => result.kind === "new");
    const changedBlocks = results.filter((result) => result.kind === "changed");

    if (newBlocks.length > 0) {
      console.log(`%cNew items for ${contractName}:`, "color: seagreen;");
      console.log(
        `%c${newBlocks.map(({ line }) => `"${line}",`).join("\n")}`,
        "color: gold",
      );
    }

    if (changedBlocks.length > 0) {
      console.log(
        `%cArtwork count changes for ${contractName}:`,
        "color: darkorange;",
      );
      changedBlocks.forEach((result) => {
        console.log(
          `%c"${result.line}", %c(${result.oldWorks} -> ${result.newWorks} works)`,
          "color: gold",
          "color: grey",
        );
      });
    }

    if (results.length === 0) {
      console.log(
        `%cNo new items or artwork count changes for ${contractName}.`,
        "color: grey;",
      );
    }
  }
}

window.fetchBlocks = async (...contracts) => {
  if (contracts.length === 0) {
    console.error("Please provide contract name(s) as arguments.");
    return;
  }
  const contractNames = contracts.length === 1 && Array.isArray(contracts[0])
    ? contracts[0]
    : contracts;
  console.log(
    `%cFetching blocks for:%c${contractNames.join(", ")}`,
    "color: indianred;",
    "color: grey;",
  );
  await blocks(contractNames);
  console.log("%cDone fetching!", "color: indianred;");
};

window.is = is;
refreshWindowContractNames();
