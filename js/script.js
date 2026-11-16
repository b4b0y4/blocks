import { makeCall, lookupAddress } from "./rpc.js";
import { list, libs, curated, playground } from "./data.js";
import {
  contractRegistry,
  abiProfiles,
  frozenContracts,
  isStudio,
  symbolAbi,
  keyFromSymbol,
} from "./constants.js";
import * as ov from "./overlay.js";

const $ = (selector) => document.querySelector(selector);
const byId = (...names) =>
  Object.fromEntries(names.map((name) => [name, document.getElementById(name)]));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const load = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
const shortId = (tokenId) => tokenId % 1000000;
const makeTokenId = (projId, n) => projId * 1000000 + n;
const shortAddr = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const safeUrl = (value) => {
  if (typeof value !== "string" || value.trim() === "") return "";
  try {
    const url = new URL(value.trim(), location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const FETCH_BATCH_SIZE = 10;
const FETCH_BATCH_DELAY = 2000;
const DEP_TYPES = ["IPFS", "ARWEAVE", "ART_BLOCKS_DEPENDENCY_REGISTRY"];
const loopTypes = ["all", "fav", "curated", "selected", "oob"];

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
    "manageListRows", "collectionForm", "collectionTarget", "collectionName",
    "collectionArtist", "collectionPlatform", "collectionWorks", "collectionCancel",
    "collectionStatus", "manageCopyList", "manageReset", "manageUpdate",
    "copyStatus", "updateStatus", "manageUpdateResults", "manageContractRows",
    "contractToggle", "contractSection", "contractSectionToggle",
    "contractSectionLabel", "contractSectionIcon", "contractForm", "contractAbi",
    "contractAddress", "contractPlatform", "contractStart", "contractCancel",
    "contractStatus", "manageCopyContracts",
  ),
};

const panels = [
  dom.instruction, dom.panel, dom.listPanel, dom.favPanel,
  dom.favMenu, dom.dropMenu, dom.managePanel,
];

const rpcUrl = localStorage.getItem("rpcUrl");
const call = makeCall(rpcUrl);
dom.rpcUrlInput.placeholder = rpcUrl || "Enter RPC URL";

const baseContractRegistry = contractRegistry;
const platformByProject = new Map();

let overlay = ov.loadOverlay();
let registry = {};
let PMPV0_ADDR = "";
let activeList = [];
let contractData = load("contractData");
let favorite = load("favorite") || {};
let loopState = load("loopState") || {
  isLooping: "false",
  interval: 60000,
  action: null,
  intervalId: null,
};

let listEdit = null;
let contractEditKey = null;
let listManageEntries = [];
let contractManageEntries = [];
let updateResults = [];
let updateRunning = false;
let contractSectionOpen = false;
let grabRequestId = 0;
let lastFrameHTML = "";

const saveLoopState = () => save("loopState", loopState);

function rebuildPlatformIndex() {
  platformByProject.clear();
  activeList.forEach((line) => {
    const parsed = ov.parseListLine(line);
    if (parsed && !parsed.hidden && parsed.platform)
      platformByProject.set(`${parsed.contract}${parsed.projectId}`, parsed.platform);
  });
}

if (ov.pruneReconciledAdditions(overlay, list)) ov.saveOverlay(overlay);

function rebuildRuntimeContracts() {
  registry = { ...baseContractRegistry };
  let overlayChanged = false;

  Object.entries(overlay.contracts).forEach(([key, config]) => {
    const bundled = baseContractRegistry[key];
    const samePlatform = config.platform === (bundled?.platform || "");

    if (
      bundled &&
      config.abi === bundled.abi &&
      String(config.address || "").toLowerCase() ===
        String(bundled.address || "").toLowerCase() &&
      samePlatform &&
      (config.startProjId ?? 0) === (bundled.startProjId ?? 0)
    ) {
      delete overlay.contracts[key];
      overlayChanged = true;
    } else if (abiProfiles[config.abi]) {
      registry[key] = config;
    }
  });

  PMPV0_ADDR = registry.PMPV0 ? registry.PMPV0.address.toLowerCase() : "";
  return overlayChanged;
}

const overlayDirty = rebuildRuntimeContracts();
activeList = ov.mergeList(list, overlay);
rebuildPlatformIndex();

const contractAt = (key) => registry[key];
const isV3 = (contract) => contractAt(contract).abi.startsWith("v3");
const isFlex = (contract) => contractAt(contract).abi.endsWith("Flex");

const contractCall = (contract, fnName, ...args) => {
  const { abi, address } = contractAt(contract);
  return call(address, abiProfiles[abi], fnName, args);
};

const parseQuery = (query) => {
  const [searchQuery = "", numberQuery = ""] = query.split("#").map((s) => s.trim());
  return { searchQuery, numberQuery };
};

const isPmpDep = (d) =>
  d?.dependency_type === "ONCHAIN" &&
  (d.bytecode_address?.toLowerCase() === PMPV0_ADDR ||
    (typeof d.data === "string" && d.data.trim().startsWith("#web3call")));

const findPmpDep = (deps = []) => deps.find(isPmpDep);

function parseListLine(line) {
  const parsed = ov.parseListLine(line);
  if (!parsed) return { collection: "", artist: "", workCount: "" };
  const { collection, artist, works } = parsed;
  return { collection, artist, workCount: `${works} ${works === 1 ? "Work" : "Works"}` };
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
        const idMatch = line.match(/^BLOCKS(?:\[[2-5]\])?(\d+)/);
        return (
          idMatch &&
          (curated.includes(parseInt(idMatch[1])) ||
            line.startsWith("BLOCKS[4]") ||
            line.startsWith("BLOCKS[5]"))
        );
      });
    } else {
      const exact = [];
      const partial = [];

      this.originalList.forEach((line) => {
        if (line.split(" # ").length < 2) return;
        const { collection, artist } = parseListLine(line);
        const name = collection.trim().toLowerCase();
        const artistName = artist.trim().toLowerCase();

        if (name === query) exact.push(line);
        else if (name.includes(query) || (artistName && artistName.includes(query)))
          partial.push(line);
      });
      this.filteredList = exact.length > 0 ? exact : partial;
    }

    this.selectedIndex = -1;
    return this.filteredList;
  }

  navigate(direction) {
    const max = this.filteredList.length - 1;
    this.selectedIndex =
      direction === "up"
        ? this.selectedIndex <= 0 ? max : this.selectedIndex - 1
        : this.selectedIndex >= max ? 0 : this.selectedIndex + 1;
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

function listItemHTML(line, index, numberQuery = "", selected = false) {
  const { collection, artist, workCount } = parseListLine(line);
  const displayName = numberQuery ? `${collection} #${numberQuery}` : collection;
  return `<p class="list-item ${selected ? "selected" : ""}" data-index="${index}">
           ${escapeHTML(displayName)}
           <span>${escapeHTML(artist)} - ${escapeHTML(workCount)}</span>
        </p>`;
}

function displayList(items, numberQuery = "") {
  dom.listPanel.innerHTML = `<div>${items
    .map((line, i) => listItemHTML(line, i, numberQuery, i === listManager.selectedIndex))
    .join("")}</div>`;
}

function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const newIndex = listManager.navigate(event.key === "ArrowUp" ? "up" : "down");
    const { numberQuery } = parseQuery(dom.search.value.trim());
    displayList(listManager.filteredList, numberQuery);
    dom.listPanel
      .querySelector(`[data-index="${newIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    const selectedItem = listManager.getSelected();
    const query = dom.search.value.trim();
    if (selectedItem) getToken(selectedItem, query);
    else if (query === "curated") getRandom(listManager.filteredList);
    else if (query === "") getRandom(listManager.originalList);
    else if (listManager.filteredList.length > 0)
      getToken(listManager.filteredList[0], query);
  }
}

const fetchHash = (tokenId, contract) =>
  contractCall(
    contract,
    contract === "BLOCKS" ? "showTokenHashes" : "tokenIdToHash",
    tokenId,
  );

const fetchProjectInfo = (projId, contract) =>
  contractCall(
    contract,
    isV3(contract) ? "projectScriptDetails" : "projectScriptInfo",
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

async function fetchEditionInfo(projId, contract) {
  const info = await contractCall(
    contract,
    isV3(contract) ? "projectStateData" : "projectTokenInfo",
    projId,
  );
  return { edition: Number(info.maxInvocations), minted: Number(info.invocations) };
}

const fetchExtDepCount = async (projId, contract) =>
  (await contractCall(contract, "projectExternalAssetDependencyCount", projId)) || null;

async function fetchCIDs(projId, extDepCount, contract) {
  const tuples = await Promise.all(
    Array.from({ length: Number(extDepCount) }, (_, i) =>
      contractCall(contract, "projectExternalAssetDependencyByIndex", projId, i),
    ),
  );

  if (!isV3(contract))
    return tuples.map((t) => ({
      cid: t.cid,
      dependency_type: DEP_TYPES[Number(t.dependencyType ?? 0)] || "IPFS",
      data: null,
      isOnchain: false,
  }));

  return tuples.map((tuple) => {
    const type = Number(tuple.dependencyType || 0);

    if (type === 2) {
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
      dependency_type: DEP_TYPES[type] || "IPFS",
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
  const raw = await call(pmpAddress, abiProfiles.PMPV0, "getTokenParams", [
    contractAt(contract).address,
    tokenId,
  ]).catch(() => []);
  return Object.fromEntries(
    raw.map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]),
  );
}

async function loadTokenParams(extDep, contract, tokenId) {
  const pmpDep = findPmpDep(extDep);
  return pmpDep ? fetchTokenParams(pmpDep.bytecode_address, contract, tokenId) : null;
}

async function grabData(tokenId, contract, updateOnly = false) {
  const requestId = ++grabRequestId;
  const isCurrentRequest = () => requestId === grabRequestId;

  try {
    toggleSpin();
    clearPanels();
    console.log("Contract:", contract, "Token Id:", tokenId);

    if (updateOnly) {
      const [hash, { owner, ensName }] = await Promise.all([
        fetchHash(tokenId, contract),
        fetchOwner(tokenId, contract),
      ]);
      if (!isCurrentRequest()) return;

      const data = load("contractData");
      Object.assign(data, { tokenId, contract, hash, owner, ensName });

      const tokenParams = await loadTokenParams(data.extDep, contract, tokenId);
      if (!isCurrentRequest()) return;
      if (tokenParams) data.tokenParams = tokenParams;

      save("contractData", data);
      update(data);
      return;
    }

    const projId = Math.floor(tokenId / 1000000);
    const [hash, projectInfo, detail, { owner, ensName }, { edition, minted }] =
      await Promise.all([
        fetchHash(tokenId, contract),
        fetchProjectInfo(projId, contract),
        contractCall(contract, "projectDetails", projId),
        fetchOwner(tokenId, contract),
        fetchEditionInfo(projId, contract),
      ]);
    if (!isCurrentRequest()) return;

    const [script, extLib] = await Promise.all([
      constructScript(projId, projectInfo, contract),
      extractLibraryName(projectInfo),
    ]);
    if (!isCurrentRequest()) return;

    let extDep = [];
    let ipfs = null;
    let arweave = null;
    let tokenParams = null;

    if (isFlex(contract)) {
      const extDepCount = await fetchExtDepCount(projId, contract);
      if (!isCurrentRequest()) return;
      if (extDepCount) {
        [extDep, { ipfs, arweave }] = await Promise.all([
          fetchCIDs(projId, extDepCount, contract),
          fetchGateway(contract),
        ]);
        if (!isCurrentRequest()) return;
        if (["MOMENTFLEX"].includes(contract)) ipfs = "https://ipfs.filebase.io/ipfs";
      }
      tokenParams = await loadTokenParams(extDep, contract, tokenId);
      if (!isCurrentRequest()) return;
    }

    update({
      tokenId, contract, projId, hash, script, detail, owner, ensName, extLib,
      edition, minted, extDep, ipfs, arweave, tokenParams,
    });
  } catch (error) {
    if (!isCurrentRequest()) return;
    console.error(`grabData (${updateOnly ? "update" : "full"})`, error);
    toggleSpin(false);
  }
}

function normalizeContract(data) {
  const key =
    data.contractKey ??
    (typeof data.contract === "string"
      ? data.contract
      : Object.keys(registry)[data.contract]);
  if (!registry[key]) return null;
  const { contractKey, ...rest } = data;
  return { ...rest, contract: key };
}

function update(data, { cancelPending = false } = {}) {
  if (cancelPending) grabRequestId += 1;

  const normalized = normalizeContract(data);
  if (!normalized) {
    console.error("Unknown contract:", data.contract);
    toggleSpin(false);
    return false;
  }

  contractData = normalized;
  const platform = getPlatform(contractData.contract, contractData.projId);

  save("contractData", contractData);
  pushItemToLocalStorage(contractData);
  injectFrame();
  updateUI({ ...contractData, platform });
  setUIControls();
  toggleSpin(false);
  return true;
}

const replaceIPFSGateways = (content) =>
  content.replace(
    /https:\/\/(pinata\.[a-z0-9-]+\.[a-z]+|[a-z0-9-]+\.mypinata\.cloud|ipfs\.io)/g,
    "https://ipfs.filebase.io",
  );

function pushItemToLocalStorage({
  contract, tokenId, hash, script, extLib, extDep = [], ipfs, arweave, tokenParams,
}) {
  const tokenIdStr = tokenId.toString();

  if (
    (contract === "MOMENTFLEX" && !tokenIdStr.startsWith("16")) ||
    (contract === "HODLERS" && tokenIdStr.startsWith("13"))
  ) {
    script = replaceIPFSGateways(script);
  }

  const src = [libs[extLib]];
  if (extDep[0]?.cid?.includes("@")) src.push(libs[extDep[0].cid]);
  const scripts = src.filter(Boolean);

  const tokenData = { tokenId: tokenIdStr };

  if (extDep.length) {
    tokenData.externalAssetDependencies = extDep.map((d) => {
      let cid = d.cid;
      if (contract === "MOMENTFLEX" && tokenIdStr.startsWith("16"))
        cid = replaceIPFSGateways(cid);

      const type = d.isOnchain
        ? d.dependency_type
        : d.dependency_type ||
          (/^(Qm|baf)/.test(cid) || cid.includes("/ipfs/")
            ? "IPFS"
            : /^[\w-]{43}$/.test(cid)
              ? "ARWEAVE"
              : "ART_BLOCKS_DEPENDENCY_REGISTRY");

      const hasParams = isPmpDep(d) && tokenParams && Object.keys(tokenParams).length > 0;

      return {
        cid,
        dependency_type: type,
        data: hasParams ? tokenParams : d.isOnchain ? d.data : null,
        ...(d.bytecode_address ? { bytecode_address: d.bytecode_address } : {}),
      };
    });
    tokenData.preferredIPFSGateway = ipfs || "https://filebase.io/ipfs/";
    tokenData.preferredArweaveGateway = arweave || "https://arweave.net/";
    tokenData.hash = hash;
  } else if (contract === "BLOCKS") {
    tokenData.hashes = Array.isArray(hash) ? hash : [hash];
  } else {
    tokenData.hash = hash;
  }

  save("scriptData", {
    src: scripts,
    tokenIdHash: `let tokenData = ${JSON.stringify(tokenData)}`,
    process: extLib.startsWith("processing") ? "application/processing" : "",
    script,
  });
}

function getPlatform(contractName, projId) {
  const inline = platformByProject.get(contractName + projId);
  if (inline) return inline;

  if (["BLOCKS", "BLOCKS[2]", "BLOCKS[3]"].includes(contractName)) {
    return curated.includes(projId)
      ? "Art Blocks Curated"
      : playground.includes(projId)
        ? "Art Blocks Playground"
        : projId < 374
          ? "Art Blocks Factory"
          : "Art Blocks Presents";
  }
  const entry = registry[contractName];
  if (entry?.platform) return entry.platform;
  return isStudio(contractName) ? "Art Blocks Studio" : "";
}

function getLibVersion(extLib) {
  return (
    Object.keys(libs).find((key) => key.startsWith(extLib.replace(/js$/, "") + "@")) ||
    extLib
  );
}

const showExtDep = (dep) =>
  dep && !["ONCHAIN", "ART_BLOCKS_DEPENDENCY_REGISTRY"].includes(dep.dependency_type);

function getExtDepType(dep, contract) {
  if (contract === "MOMENTFLEX") return "ipfs";
  const isIPFS =
    dep.dependency_type === "IPFS" ||
    (dep.cid && (dep.cid.startsWith("Qm") || dep.cid.startsWith("baf")));
  return isIPFS ? "ipfs" : "arweave";
}

function editionTxt(edition, minted) {
  return edition - minted > 0
    ? `${minted} / ${edition} Minted`
    : `${edition} Work${edition > 1 ? "s" : ""}`;
}

const createSection = (title, content) =>
  content
    ? `<div class="section">
         <p class="more">
           ${title} <br>
           ${content}
         </p>
       </div>`
    : "";

const extractDomain = (href) => new URL(href).host.replace(/^www\./, "");

function renderInfoTitle(text) {
  dom.info.innerHTML = "";
  dom.info.classList.remove("scrolling");

  const span = document.createElement("span");
  span.textContent = text;
  dom.info.appendChild(span);

  if (span.offsetWidth > dom.info.offsetWidth) {
    dom.info.style.setProperty("--scroll-duration", `${span.offsetWidth / 30}s`);
    const duplicate = span.cloneNode(true);
    duplicate.setAttribute("aria-hidden", "true");
    dom.info.appendChild(duplicate);
    dom.info.classList.add("scrolling");
  }
}

function updateUI({
  contract, owner, ensName, extLib, detail, tokenId, platform, edition, minted, extDep,
}) {
  renderInfoTitle(`${detail[0]} #${shortId(tokenId)}${detail[1] ? ` / ${detail[1]}` : ""}`);

  const showLib =
    extLib && !["js", "svg", "custom"].some((prefix) => extLib.startsWith(prefix));
  const libInfo = showLib
    ? escapeHTML(getLibVersion(extLib)) +
      (extDep.length > 0 && extDep[0].cid && extDep[0].cid.length < 10
        ? ` <br> ${escapeHTML(extDep[0].cid)}`
        : "")
    : "";

  const showExt =
    (extDep.length > 0 && showExtDep(extDep[0])) || contract === "MOMENTFLEX";
  const extInfo = showExt ? escapeHTML(getExtDepType(extDep[0], contract)) : "";
  const dependencyInfo =
    libInfo && extInfo ? `${libInfo} <br> ${extInfo}` : libInfo || extInfo;
  const website = safeUrl(detail[3]);

  const copyLink = (title, href, label, copyText = href) =>
    createSection(
      title,
      `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>
       <span class="copy-txt" data-text="${escapeHTML(copyText)}">
         <i class="fa-regular fa-copy"></i>
       </span>`,
    );
  const copyVal = (title, val) =>
    createSection(
      title,
      `<span class="copy-txt" data-text="${escapeHTML(val)}">${escapeHTML(val)} <i class="fa-regular fa-copy"></i></span>`,
    );
  const plain = (title, val) =>
    val ? createSection(title, `<span class="no-copy-txt">${val}</span>`) : "";

  const { address } = contractAt(contract);

  dom.panel.innerHTML = `
     <div class="work">${escapeHTML(detail[0])}</div>
     <p>
       <span class="artist">${escapeHTML(detail[1])}${platform ? ` &bull; ${escapeHTML(platform)}` : ""}</span><br>
       <span class="edition">${escapeHTML(editionTxt(edition, minted))}</span>
     </p>
     <p>${escapeHTML(detail[2])}</p>
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
         ${copyLink("CONTRACT", `https://etherscan.io/address/${address}`, shortAddr(address), address)}
         ${copyVal("TOKEN ID", tokenId)}
       </div>
       <div class="column">
         ${
           website
             ? createSection(
                 "ARTIST WEBSITE",
                 `<a href="${escapeHTML(website)}" target="_blank" rel="noopener noreferrer">${escapeHTML(extractDomain(website))}</a>`,
               )
             : ""
         }
         ${plain("DEPENDENCY", dependencyInfo)}
         ${plain("LICENSE", escapeHTML(detail[4]))}
       </div>
     </div>
   `;
}

function injectFrame() {
  try {
    const { src: rawSrc = [], tokenIdHash, process, script } = load("scriptData");
    const src = (Array.isArray(rawSrc) ? rawSrc : []).filter(Boolean);
    const { extLib } = contractData;

    const styles = `
      html { height: 100%; }
      body { min-height: 100%; margin: 0; padding: 0; background-color: transparent; }
      canvas { padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0; }`;

    const three167 = src.find((s) => s.includes("three.js/0.167.0"));

    const scriptTags = three167
      ? `<script type="importmap">
          {
            "imports": {
              "three":  "${three167}"
            }
          }
        </script>`
      : src.map((s) => `<script src="${s}"></script>`).join("");

    const canvasAndScript = process
      ? `<script type="${process}">${script}</script><canvas></canvas>`
      : `<canvas${extLib.startsWith("babylon") ? ' id="babylon-canvas"' : ""}></canvas><script${three167 ? ' type="module"' : ""}>${script}</script>`;

    const html = extLib.startsWith("custom")
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

    lastFrameHTML = html;
    dom.frame.srcdoc = html;
  } catch (error) {
    console.error("injectFrame:", error);
  }
}

function getToken(line, searchQuery) {
  if (!line) return;
  const match = line.match(/^([A-Z]+(?:\[\d+\])?)\s?(\d+).*?(\d+)\s*Work/);
  if (!match) return;

  const [, contract, projIdStr, tokenStr] = match;

  if (!registry[contract]) {
    console.error(`Unknown contract in collection line: ${contract}`);
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
    const usable = source.filter((line) => {
      const p = ov.parseListLine(line);
      return p && registry[p.contract];
    });
    if (usable.length) getToken(usable[Math.floor(Math.random() * usable.length)], "");
  } else if (typeof source === "object" && Object.keys(source).length > 0) {
    const keys = Object.keys(source);
    update(source[keys[Math.floor(Math.random() * keys.length)]], { cancelPending: true });
  }
}

function exploreAlgo() {
  if (contractData.detail[0] === "Unigrids") return;

  const hash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const base = contractData.projId * 1000000;
  const minToken = base + contractData.minted;
  const maxToken = base + 999999;
  if (minToken > maxToken) return;
  const tokenId = Math.floor(Math.random() * (maxToken - minToken + 1) + minToken);

  Object.assign(contractData, { hash, tokenId, owner: "", ensName: "" });
  update(contractData, { cancelPending: true });
}

function stepTokenId(dir) {
  if (!contractData || contractData.minted <= 0) return;
  const max = contractData.minted - 1;
  const n = shortId(contractData.tokenId);
  const next = dir > 0 ? (n === max ? 0 : n + 1) : n === 0 ? max : n - 1;
  contractData.tokenId = makeTokenId(contractData.projId, next);
  grabData(contractData.tokenId, contractData.contract, true);
}

function findCurrentCollectionLine(name) {
  const key = contractData?.contract;
  return listManager.originalList.find((line) => {
    const parsed = ov.parseListLine(line);
    return (
      parsed &&
      parsed.contract === key &&
      parsed.collection.trim() === name
    );
  });
}

const loopActions = {
  allLoop: () => getRandom(listManager.originalList),
  favLoop: () => getRandom(favorite),
  curatedLoop: () => {
    listManager.filterByQuery("curated");
    getRandom(listManager.filteredList);
  },
  selectedLoop: () => {
    const name = contractData.detail[0].trim();
    const line = findCurrentCollectionLine(name);
    if (line) getToken(line, "");
  },
  oobLoop: exploreAlgo,
};

function performAction(action) {
  clearPanels();
  try {
    loopActions[action]?.();
  } catch (error) {
    console.error(`Loop action ${action} failed:`, error);
  }
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
  loopState = { ...loopState, isLooping: "false", intervalId: null };
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
  const interval =
    inputValue === "" ? loopState.interval : parseInt(inputValue, 10) * 60000;

  if (!Number.isFinite(interval) || interval <= 0) {
    alert("Please enter a time in minutes.");
    return updateLoopButton();
  }
  if (action === "favLoop" && Object.keys(favorite).length === 0) {
    alert("Save a favorite first.");
    return updateLoopButton();
  }

  loopRandom(interval, action);
  dom.loopInput.value = "";
  dom.loopInput.placeholder = `${interval / 60000} min`;
  updateLoopButton();
}

const updateLoopButton = () => {
  const looping = loopState.isLooping === "true";
  $(".fa-repeat").style.display = looping ? "none" : "inline-block";
  $(".fa-circle-stop").style.display = looping ? "inline-block" : "none";
};

const favoriteKey = ({ contract, tokenId }) => `${contract}:${tokenId}`;

function saveOutput() {
  let content = lastFrameHTML;
  try {
    content = dom.frame.contentDocument?.documentElement?.outerHTML || content;
  } catch { }
  if (!content) return;

  const id = shortId(contractData.tokenId);
  const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${contractData.detail[0].replace(/\s+/g, "-")}#${id}.html`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  link.remove();

  favorite[favoriteKey(contractData)] = contractData;
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
    const data = favorite[key] || {};
    const id = data.tokenId !== undefined && data.tokenId !== null
      ? shortId(data.tokenId)
      : null;
    const name = data.detail?.[0] ?? key;
    const artist = data.detail?.[1] ?? "";


    const row = document.createElement("p");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center";

    const label = document.createElement("span");
    label.className = "fav-item";
    label.textContent = id === null ? name : `${name} #${id}`;

    const artistEl = document.createElement("span");
    artistEl.textContent = artist;
    label.appendChild(artistEl);

    const del = document.createElement("span");
    del.className = "delete-btn";
    del.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    del.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteFavoriteFromStorage(key);
      displayFavoriteList();
    });

    row.addEventListener("click", () => {
      toggleSpin();
      update(favorite[key], { cancelPending: true });
      clearPanels();
    });

    row.append(label, del);
    dom.favPanel.appendChild(row);
  });
}

const clearDataStorage = () =>
  ["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d));

const clearPanels = () =>
  [dom.overlay, dom.infobar, ...panels].forEach((el) => el.classList.remove("active"));

const togglePanel = (panelElement) => {
  panels.forEach((p) =>
    p !== panelElement ? p.classList.remove("active") : (p.scrollTop = 0),
  );
  const isActive = panelElement.classList.toggle("active");
  [dom.overlay, dom.infobar].forEach((el) => el.classList.toggle("active", isActive));
};

const bindPanelToggle = (el, panel, before) =>
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    before?.();
    togglePanel(panel);
  });

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

const setManageStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle("error", isError);
};

const fail = (element, message) => {
  setManageStatus(element, message, true);
  return false;
};

const persistOverlay = () => {
  const saved = ov.saveOverlay(overlay);
  if (!saved)
    setManageStatus(dom.collectionStatus, "Could not save changes in this browser.", true);
  return saved;
};

if (overlayDirty) persistOverlay();

const lineFromParsed = (parsed, works = parsed.works) =>
  ov.makeListLine({ ...parsed, works });

const manageButton = (action, label, attr = "data-action", extra = "") =>
  `<button type="button" class="manage-btn${extra ? ` ${extra}` : ""}" ${attr}="${action}">${label}</button>`;

function commitChanges(statusElement, message, { contracts = false } = {}) {
  if (!persistOverlay()) return false;
  refreshLibrary({ contracts });
  setManageStatus(statusElement, message);
  return true;
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
    if (rebuildRuntimeContracts()) persistOverlay();
    populateManagementSelects();

    if (contractData && !registry[contractData.contract]) {
      clearDataStorage();
      contractData = null;
      setUIControls();
    }
  }

  activeList = ov.mergeList(list, overlay);
  rebuildPlatformIndex();
  listManager.setList(activeList);

  if (dom.listPanel.classList.contains("active")) {
    const { searchQuery, numberQuery } = parseQuery(dom.search.value.trim());
    displayList(
      searchQuery ? listManager.filterByQuery(searchQuery) : listManager.originalList,
      searchQuery ? numberQuery : "",
    );
  }

  renderManageList();
  renderManageContracts();
}

function renderManageList() {
  const entries = ov.listEntries(list, overlay).filter((entry) => entry.kind !== "base");
  listManageEntries = entries;

  if (entries.length === 0) {
    dom.manageListRows.innerHTML = '<p class="manage-status">No local changes yet.</p>';
    return;
  }

  dom.manageListRows.innerHTML = entries
    .map((entry, index) => {
      const hidden = entry.kind === "removed" || ov.parseListLine(entry.line)?.hidden;
      const actions = hidden
        ? `${manageButton("unhide", "Unhide")}${manageButton("remove", "Remove")}`
        : `${manageButton("edit", "Edit")}${manageButton("hide", "Hide")}${manageButton("remove", "Remove")}`;

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

const contractKind = (key) =>
  !baseContractRegistry[key] ? "custom" : overlay.contracts[key] ? "overridden" : "bundled";

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
      return `<div class="manage-item" data-contract-index="${index}">
        <p class="manage-item-main">${escapeHTML(key)}
          <span class="manage-badge">${contractKind(key)}</span></p>
        <p class="manage-item-main">${config.abi} &bull; ${shortAddr(config.address)}${
          config.platform ? ` &bull; ${escapeHTML(config.platform)}` : ""
        }${config.startProjId !== undefined ? ` &bull; start ${config.startProjId}` : ""}</p>
        <div class="manage-item-actions">
          ${manageButton("edit", "Edit")}
          ${manageButton("remove", "Remove")}
        </div>
      </div>`;
    })
    .join("");
}

function setCollectionFormOpen(open) {
  dom.collectionForm.hidden = !open;
  if (open) {
    setManageStatus(dom.collectionStatus, "");
  } else {
    listEdit = null;
    dom.collectionForm.reset();
    dom.collectionTarget.textContent = "Edit collection";
  }
}

function setContractFormOpen(open) {
  dom.contractForm.hidden = !open;
  dom.contractToggle.textContent = open ? "Cancel" : "+ Add contract";
  if (open) {
    setManageStatus(dom.contractStatus, "");
  } else {
    contractEditKey = null;
    dom.contractForm.reset();
    dom.contractAbi.value = "v3Flex";
  }
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
  dom.collectionPlatform.value = parsed.platform;
  dom.collectionWorks.value = parsed.works;
  dom.collectionForm.scrollIntoView({ block: "nearest" });
}

function startContractEdit(key) {
  const config = registry[key];
  if (!config) return;

  setContractFormOpen(true);
  contractEditKey = key;
  dom.contractAbi.value = config.abi;
  dom.contractAddress.value = config.address;
  dom.contractPlatform.value = config.platform || "";
  dom.contractStart.value = config.startProjId ?? "";
  setManageStatus(dom.contractStatus, `Editing ${key}.`);
  dom.contractForm.scrollIntoView({ block: "nearest" });
}

const countKind = (results, kind) => results.filter((r) => r.kind === kind).length;

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
      ? `<p class="manage-status">Showing first ${limit} of ${updateResults.length}. Apply all the results.</p>`
      : "";
  const kinds = new Set(updateResults.map((r) => r.kind));
  const applyLabel =
    kinds.size > 1 ? "Apply all" : kinds.has("new") ? "Add all" : "Update all";

  dom.manageUpdateResults.innerHTML = `${rows}${more}
    <div class="manage-row">
      ${manageButton("apply-all", `${applyLabel} (${updateResults.length})`, "data-update-action", "primary")}
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
  if (!currentParsed || !nextParsed || currentParsed.works === nextParsed.works)
    return null;

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

async function fetchStartingProjectId(address, abi) {
  try {
    const start = Number(await call(address, abiProfiles[abi], "startingProjectId", []));
    return Number.isFinite(start) ? start : 0;
  } catch {
    return 0;
  }
}

async function chainStartProjId(contract) {
  if (!isV3(contract)) return 0;
  const { address, abi } = contractAt(contract);
  return fetchStartingProjectId(address, abi);
}

async function fetchProjectLines(contractName, { onLine, onProgress } = {}) {
  if (!registry[contractName]) throw new Error(`Unknown contract: ${contractName}`);

  const start = Math.max(
    registry[contractName].startProjId || 0,
    await chainStartProjId(contractName),
  );
  const end = Number(await contractCall(contractName, "nextProjectId"));
  const ids = Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
  const stateFn = isV3(contractName) ? "projectStateData" : "projectTokenInfo";

  for (let offset = 0; offset < ids.length; offset += FETCH_BATCH_SIZE) {
    const batchIds = ids.slice(offset, offset + FETCH_BATCH_SIZE);
    const results = await Promise.all(
      batchIds.map(async (id) => {
        try {
          const detail = await contractCall(contractName, "projectDetails", id.toString());
          const token = await contractCall(contractName, stateFn, id);
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

    onProgress?.({ scanned: offset + batchIds.length, total: ids.length });

    if (offset + FETCH_BATCH_SIZE < ids.length) await sleep(FETCH_BATCH_DELAY);
  }
}

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
  if (!rpcUrl) return setManageStatus(dom.updateStatus, "Set an RPC URL first.", true);
  if (updateRunning) return;

  updateRunning = true;
  dom.manageUpdate.disabled = true;
  updateResults = [];
  renderUpdateResults();
  setManageStatus(dom.updateStatus, "Checking active contracts...");

  const known = knownListIdentities();
  const currentEntries = currentLibraryEntries();
  const contracts = Object.keys(registry).filter((key) => !frozenContracts.has(key));
  let failed = 0;

  try {
    for (const [i, key] of contracts.entries()) {
      setManageStatus(dom.updateStatus, `Checking ${key} (${i + 1}/${contracts.length})...`);

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
              `${key}: ${scanned}/${total} checked${parts.length ? ` (${parts.join(", ")})` : ""}...`,
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

    const suffix = failed ? ` ${failed} contract(s) could not be checked.` : "";
    const newCount = countKind(updateResults, "new");
    const changedCount = countKind(updateResults, "changed");

    if (!newCount && !changedCount) {
      setManageStatus(dom.updateStatus, `No new collections or artwork count changes.${suffix}`);
      return;
    }

    const parts = [];
    if (newCount) parts.push(`${newCount} new collection(s)`);
    if (changedCount) parts.push(`${changedCount} artwork count change(s)`);
    setManageStatus(dom.updateStatus, `Found ${parts.join(" and ")}. Review them below.${suffix}`);
  } finally {
    updateRunning = false;
    dom.manageUpdate.disabled = false;
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
  renderManageList();
  renderManageContracts();
  setCollectionFormOpen(false);
  setContractFormOpen(false);

  bindPanelToggle(dom.manage, dom.managePanel, () => {
    renderManageList();
    renderManageContracts();
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
    const rowIndex = Number(row?.dataset.updateIndex);
    const result = updateResults[rowIndex];
    if (!result) return;

    updateResults.splice(rowIndex, 1);
    if (action === "apply") {
      applyUpdateResult(result);
      commitChanges(
        dom.updateStatus,
        result.kind === "new" ? "Collection added." : "Artwork count updated.",
      );
    }
    renderUpdateResults();
  });

  dom.contractSectionToggle.addEventListener("click", () =>
    setContractSectionOpen(!contractSectionOpen),
  );

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
    const isAdded = entry.kind === "added";
    const editingThis = () =>
      listEdit && (listEdit.original === entry.original || listEdit.additionLine === entry.line);

    if (action === "edit") {
      startListEdit(entry);
    } else if (action === "hide") {
      if (editingThis()) setCollectionFormOpen(false);
      if (isAdded) ov.hideAddition(overlay, entry.line);
      else ov.applyRemove(overlay, entry.original);
      commitChanges(dom.collectionStatus, "Collection hidden. It stays here so you can unhide it.");
    } else if (action === "unhide") {
      if (entry.kind === "removed") ov.restoreOriginal(overlay, entry.original);
      else ov.unhideAddition(overlay, entry.line);
      commitChanges(dom.collectionStatus, "Collection unhidden. It is back in the library.");
    } else if (action === "remove") {
      if (!confirm("Discard this local change?")) return;
      if (editingThis()) setCollectionFormOpen(false);
      if (isAdded) overlay.list = overlay.list.filter((c) => c.line !== entry.line);
      else {
        ov.restoreOriginal(overlay, entry.original);
        ov.removeEdit(overlay, entry.original);
      }
      commitChanges(dom.collectionStatus, "Local change removed.");
    }
  });

  dom.collectionCancel.addEventListener("click", () => {
    setCollectionFormOpen(false);
    setManageStatus(dom.collectionStatus, "");
  });

  dom.collectionForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!listEdit) return fail(dom.collectionStatus, "Choose a collection to edit.");

    const collection = dom.collectionName.value.trim();
    const artist = dom.collectionArtist.value.trim();
    const platform = dom.collectionPlatform.value.trim();
    const works = Number(dom.collectionWorks.value);

    if (!collection) return fail(dom.collectionStatus, "Enter a collection name.");
    if (!Number.isInteger(works) || works < 0)
      return fail(dom.collectionStatus, "Enter a valid work count.");

    const line = lineFromParsed({ ...listEdit.parsed, collection, artist, platform }, works);

    if (!ov.parseListLine(line))
      return fail(
        dom.collectionStatus,
        "Contract keys must be letters, optionally followed by [number].",
      );

    if (listEdit.additionLine) ov.applyAdd(overlay, line, listEdit.additionLine);
    else ov.applyEdit(overlay, listEdit.original, line);

    if (commitChanges(dom.collectionStatus, "Collection saved.")) setCollectionFormOpen(false);
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

  dom.contractForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const config = ov.normalizeContractConfig({
      abi: dom.contractAbi.value,
      address: dom.contractAddress.value,
      platform: dom.contractPlatform.value,
      startProjId: dom.contractStart.value,
    });

    if (!config || !abiProfiles[config.abi])
      return fail(dom.contractStatus, "Enter a valid ABI, 0x address and start project ID (if set).");

    let key = contractEditKey;
    if (!key) {
      if (!rpcUrl) return fail(dom.contractStatus, "Set an RPC URL first.");
      try {
        key = keyFromSymbol(
          await call(config.address, symbolAbi, "symbol", []),
          (k) => !!registry[k],
        );
      } catch (error) {
        console.error("symbol() lookup failed:", error);
        return fail(dom.contractStatus, `Could not read symbol(): ${error.message}`);
      }
      if (!key || registry[key])
        return fail(dom.contractStatus, `Key "${key}" is empty or already used.`);

      if (config.startProjId === undefined) {
        const start = await fetchStartingProjectId(config.address, config.abi);
        if (start > 0) config.startProjId = start;
      }
    }

    const message = contractEditKey
      ? "Contract updated."
      : `Contract added as ${key}. Press "Update list" to fetch its collections.`;
    overlay.contracts[key] = config;
    if (commitChanges(dom.contractStatus, message, { contracts: true }))
      setContractFormOpen(false);
  });

  bindCopyButton(
    dom.manageCopyList,
    () => ov.exportListJS(list, overlay, Object.keys(registry)),
    dom.copyStatus,
    "Full list JS copied. Replace list in js/data.js.",
    "Could not copy the list.",
  );

  bindCopyButton(
    dom.manageCopyContracts,
    () => ov.exportContractsJS(registry, Object.keys(baseContractRegistry)),
    dom.copyStatus,
    "Full contract registry copied. Replace contractRegistry in js/constants.js.",
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
    [dom.collectionStatus, dom.contractStatus, dom.updateStatus].forEach((el) =>
      setManageStatus(el, ""),
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
    const name = contractData.detail[0].trim();
    const line = /^\d*$/.test(num)
      ? findCurrentCollectionLine(name)
      : null;

    if (!line) {
      listManager.reset();
      return clearPanels();
    }

    listManager.filteredList = [line];
    listManager.selectedIndex = 0;
    dom.listPanel.innerHTML = `<div>${listItemHTML(line, 0, num, true)}</div>`;
    openList();
    return;
  }

  const { searchQuery, numberQuery } = parseQuery(query);
  if (searchQuery === "") {
    listManager.reset();
    return clearPanels();
  }

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
bindPanelToggle(dom.searchIcon, dom.listPanel, () => {
  listManager.reset();
  displayList(listManager.originalList);
});
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

loopTypes.forEach((type) =>
  dom[`${type}Loop`].addEventListener("click", () => handleLoop(`${type}Loop`)),
);

dom.stopLoop.addEventListener("click", stopLoop);
dom.inc.addEventListener("click", () => stepTokenId(1));
dom.dec.addEventListener("click", () => stepTokenId(-1));
dom.randomButton.addEventListener("click", () => getRandom(listManager.originalList));
dom.explore.addEventListener("click", exploreAlgo);

panels.forEach((panel) =>
  panel.addEventListener("click", (event) => event.stopPropagation()),
);

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

dom.themeBtns.forEach((button) =>
  button.addEventListener("click", () => setTheme(button.dataset.theme)),
);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (localStorage.getItem("themePreference") === "system")
    dom.root.classList.toggle("dark-mode", event.matches);
});

updateLoopButton();
checkLoop();
setUIControls();
initTooltips();
setTheme(localStorage.getItem("themePreference") || "system");
initLibraryManager();
if (contractData) {
  let restored = false;
  try {
    restored = update(contractData);
  } catch (error) {
    console.error("Could not restore the previous artwork:", error);
  }
  if (!restored) {
    clearDataStorage();
    contractData = null;
    setUIControls();
  }
}
dom.root.classList.remove("no-flash");
