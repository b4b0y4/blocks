import { makeCall, lookupAddress } from "./rpc.js";
import { list, libs, curated, playground } from "./data.js";
import {
  contractRegistry as baseContractRegistry,
  abiProfiles,
  frozenContracts,
  isStudio,
  symbolAbi,
  keyFromSymbol,
} from "./constants.js";
import * as ov from "./overlay.js";

const $ = (selector) => document.querySelector(selector);
const byId = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const load = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
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

const HTML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESC[c]);

const safeUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
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
const parseGatewayHost = (value) => {
  const host = String(value ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
  return /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host.toLowerCase() : "";
};
const GATEWAY_HOST =
  parseGatewayHost(localStorage.getItem("ipfsGateway")) || "ipfs.filebase.io";
const GATEWAY_ORIGIN = `https://${GATEWAY_HOST}`;
const IPFS_GATEWAY = `${GATEWAY_ORIGIN}/ipfs/`;
const ARWEAVE_GATEWAY = "https://arweave.net/";
const GATEWAY_URL_PATTERN = /https?:\/\/[^/\s"'`()<>]+\/ipfs(?=[/?#$"'`\s]|$)/gi;
const loopTypes = ["all", "fav", "curated", "selected", "oob"];

const canonicalizeGateways = (content) =>
  content.replace(GATEWAY_URL_PATTERN, `${GATEWAY_ORIGIN}/ipfs`);

const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

const dom = {
  root: document.documentElement,
  themeBtns: document.querySelectorAll(".theme-button"),
  ...mapValues(
    {
      instruction: ".instruction", infobar: ".infobar", favMenu: ".fav-menu",
      spinner: ".spinner", panel: ".panel", listPanel: ".list-panel",
      favPanel: ".fav-panel", overlay: ".overlay", tooltip: ".tooltip",
      managePanel: ".manage-panel",
    },
    $,
  ),
  ...mapValues(
    {
      rpcUrlInput: "rpcUrl", dec: "decrementBtn", inc: "incrementBtn",
      allLoop: "loopAll", search: "searchInput", manage: "manageBtn",
    },
    byId,
  ),
  ...Object.fromEntries(
    `settings frame info explore loop repeatIcon dropMenu favLoop curatedLoop selectedLoop
     oobLoop stopLoop loopInput randomButton searchIcon favIcon favSave favOpen manageListRows
     collectionForm collectionTarget collectionName collectionArtist collectionPlatform
     collectionWorks collectionCancel collectionStatus manageCopyList manageReset manageUpdate
     copyStatus updateStatus manageUpdateResults manageContractRows contractToggle
     contractSection contractSectionToggle contractSectionLabel contractSectionIcon
     contractForm contractAbi contractAddress contractPlatform contractStart contractCancel
     contractStatus manageCopyContracts ipfsGateway`
      .split(/\s+/)
      .map((id) => [id, byId(id)]),
  ),
};

const panels = [
  dom.instruction, dom.panel, dom.listPanel, dom.favPanel,
  dom.favMenu, dom.dropMenu, dom.managePanel,
];

const rpcUrl = localStorage.getItem("rpcUrl");
const call = makeCall(rpcUrl);
dom.rpcUrlInput.placeholder = rpcUrl || "Enter RPC URL";
dom.ipfsGateway.placeholder = GATEWAY_HOST;

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
    const p = ov.parseListLine(line);
    if (p && !p.hidden && p.platform)
      platformByProject.set(`${p.contract}${p.projectId}`, p.platform);
  });
}

function rebuildRuntimeContracts() {
  registry = { ...baseContractRegistry };
  let changed = false;

  Object.entries(overlay.contracts).forEach(([key, config]) => {
    const bundled = baseContractRegistry[key];
    const matchesBundled =
      bundled &&
      config.abi === bundled.abi &&
      String(config.address).toLowerCase() === String(bundled.address).toLowerCase() &&
      config.platform === (bundled.platform || "") &&
      (config.startProjId ?? 0) === (bundled.startProjId ?? 0);

    if (matchesBundled) {
      delete overlay.contracts[key];
      changed = true;
    } else if (abiProfiles[config.abi]) {
      registry[key] = config;
    }
  });

  PMPV0_ADDR = registry.PMPV0?.address.toLowerCase() ?? "";
  return changed;
}

const pruned = ov.pruneReconciledChanges(overlay, list);
const overlayDirty = rebuildRuntimeContracts();
activeList = ov.mergeList(list, overlay);
rebuildPlatformIndex();

const contractAt = (key) => registry[key];
const isV3 = (contract) => contractAt(contract).abi.startsWith("v3");
const isFlex = (contract) => contractAt(contract).abi.endsWith("Flex");
const stateFn = (contract) => (isV3(contract) ? "projectStateData" : "projectTokenInfo");

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

class ListManager {
  constructor(lines) {
    this.setList(lines);
  }

  setList(lines) {
    this.originalList = lines.filter((line) => !line.trim().endsWith("!"));
    this.reset();
  }

  filterByQuery(query) {
    query = query.toLowerCase().trim();

    if (query === "curated") {
      this.filteredList = this.originalList.filter((line) => {
        const id = line.match(/^BLOCKS(?:\[[2-5]\])?(\d+)/);
        return id && (curated.includes(parseInt(id[1])) || /^BLOCKS\[[45]\]/.test(line));
      });
    } else {
      const exact = [];
      const partial = [];
      this.originalList.forEach((line) => {
        const { collection, artist } = ov.describeLine(line);
        const name = collection.trim().toLowerCase();
        const artistName = artist.trim().toLowerCase();
        if (name === query) exact.push(line);
        else if (name.includes(query) || (artistName && artistName.includes(query)))
          partial.push(line);
      });
      this.filteredList = exact.length ? exact : partial;
    }

    this.selectedIndex = -1;
    return this.filteredList;
  }

  navigate(direction) {
    const max = this.filteredList.length - 1;
    const i = this.selectedIndex;
    return (this.selectedIndex =
      direction === "up" ? (i <= 0 ? max : i - 1) : i >= max ? 0 : i + 1);
  }

  getSelected() {
    return this.filteredList[this.selectedIndex] ?? null;
  }

  reset() {
    this.selectedIndex = -1;
    return (this.filteredList = this.originalList);
  }
}

const listManager = new ListManager(activeList);

function listItemHTML(line, index, numberQuery = "", selected = false) {
  const { collection, artist, workCount } = ov.describeLine(line);
  const name = numberQuery ? `${collection} #${numberQuery}` : collection;
  return `<p class="list-item ${selected ? "selected" : ""}" data-index="${index}">
           ${escapeHTML(name)}
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
    const index = listManager.navigate(event.key === "ArrowUp" ? "up" : "down");
    displayList(listManager.filteredList, parseQuery(dom.search.value.trim()).numberQuery);
    dom.listPanel.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    const selected = listManager.getSelected();
    const query = dom.search.value.trim();
    if (selected) getToken(selected, query);
    else if (query === "curated") getRandom(listManager.filteredList);
    else if (query === "") getRandom(listManager.originalList);
    else if (listManager.filteredList.length) getToken(listManager.filteredList[0], query);
  }
}

const fetchHash = (tokenId, contract) =>
  contractCall(contract, contract === "BLOCKS" ? "showTokenHashes" : "tokenIdToHash", tokenId);

const fetchProjectInfo = (projId, contract) =>
  contractCall(contract, isV3(contract) ? "projectScriptDetails" : "projectScriptInfo", projId);

async function constructScript(projId, { scriptCount }, contract) {
  const count = Number(scriptCount);
  const step = count > 30 ? 25 : count;
  let script = "";

  for (let i = 0; i < count; i += step) {
    const end = Math.min(i + step, count);
    const parts = await Promise.all(
      Array.from({ length: end - i }, (_, j) =>
        contractCall(contract, "projectScriptByIndex", projId, i + j),
      ),
    );
    script += parts.join("");
    if (end < count) await sleep(300);
  }
  return script;
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
  const info = await contractCall(contract, stateFn(contract), projId);
  return { edition: Number(info.maxInvocations), minted: Number(info.invocations) };
}

const fetchExtDepCount = async (projId, contract) =>
  (await contractCall(contract, "projectExternalAssetDependencyCount", projId)) || null;

async function fetchCIDs(projId, count, contract) {
  const tuples = await Promise.all(
    Array.from({ length: Number(count) }, (_, i) =>
      contractCall(contract, "projectExternalAssetDependencyByIndex", projId, i),
    ),
  );

  return tuples.map((tuple) => {
    const depType = Number(tuple.dependencyType || 0);
    const onchain = isV3(contract) && depType === 2;
    if (!onchain)
      return { cid: tuple.cid, dependency_type: DEP_TYPES[depType] || "IPFS", data: null, isOnchain: false };

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
  });
}

async function fetchTokenParams(pmpAddress, contract, tokenId) {
  const raw = await call(pmpAddress, abiProfiles.PMPV0, "getTokenParams", [
    contractAt(contract).address,
    tokenId,
  ]).catch(() => []);
  return Object.fromEntries(raw.map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]));
}

async function loadTokenParams(extDep, contract, tokenId) {
  const pmpDep = findPmpDep(extDep);
  return pmpDep ? fetchTokenParams(pmpDep.bytecode_address, contract, tokenId) : null;
}

async function grabData(tokenId, contract, updateOnly = false) {
  const requestId = ++grabRequestId;
  const live = async (promise) => {
    const result = await promise;
    if (requestId !== grabRequestId) throw new Error("superseded");
    return result;
  };

  try {
    toggleSpin();
    clearPanels();
    console.log("Contract:", contract, "Token Id:", tokenId);

    if (updateOnly) {
      const [hash, { owner, ensName }] = await live(
        Promise.all([fetchHash(tokenId, contract), fetchOwner(tokenId, contract)]),
      );
      const data = Object.assign(load("contractData"), { tokenId, contract, hash, owner, ensName });
      const tokenParams = await live(loadTokenParams(data.extDep, contract, tokenId));
      if (tokenParams) data.tokenParams = tokenParams;
      update(data);
      return;
    }

    const projId = Math.floor(tokenId / 1000000);
    const [hash, projectInfo, detail, { owner, ensName }, { edition, minted }] = await live(
      Promise.all([
        fetchHash(tokenId, contract),
        fetchProjectInfo(projId, contract),
        contractCall(contract, "projectDetails", projId),
        fetchOwner(tokenId, contract),
        fetchEditionInfo(projId, contract),
      ]),
    );

    const extLib = extractLibraryName(projectInfo);
    const script = await live(constructScript(projId, projectInfo, contract));

    let extDep = [];
    let tokenParams = null;
    if (isFlex(contract)) {
      const count = await live(fetchExtDepCount(projId, contract));
      if (count) extDep = await live(fetchCIDs(projId, count, contract));
      tokenParams = await live(loadTokenParams(extDep, contract, tokenId));
    }

    update({
      tokenId, contract, projId, hash, script, detail, owner, ensName, extLib,
      edition, minted, extDep, tokenParams,
    });
  } catch (error) {
    if (requestId !== grabRequestId) return;
    console.error(`grabData (${updateOnly ? "update" : "full"})`, error);
    toggleSpin(false);
  }
}

function normalizeContract(data) {
  const { contractKey, ...rest } = data;
  const key =
    contractKey ??
    (typeof data.contract === "string" ? data.contract : Object.keys(registry)[data.contract]);
  return registry[key] ? { ...rest, contract: key } : null;
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
  save("contractData", contractData);
  pushItemToLocalStorage(contractData);
  injectFrame();
  updateUI({ ...contractData, platform: getPlatform(contractData.contract, contractData.projId) });
  setUIControls();
  toggleSpin(false);
  return true;
}

function pushItemToLocalStorage({ contract, tokenId, hash, script, extLib, extDep = [], tokenParams }) {
  script = canonicalizeGateways(script);

  const src = [libs[extLib]];
  if (extDep[0]?.cid?.includes("@")) src.push(libs[extDep[0].cid]);

  const tokenData = { tokenId: tokenId.toString() };

  if (extDep.length) {
    tokenData.externalAssetDependencies = extDep.map((d) => {
      const hasParams = isPmpDep(d) && tokenParams && Object.keys(tokenParams).length > 0;
      return {
        cid: canonicalizeGateways(d.cid),
        dependency_type: d.dependency_type,
        data: hasParams ? tokenParams : d.isOnchain ? d.data : null,
        ...(d.bytecode_address ? { bytecode_address: d.bytecode_address } : {}),
      };
    });
    tokenData.preferredIPFSGateway = IPFS_GATEWAY;
    tokenData.preferredArweaveGateway = ARWEAVE_GATEWAY;
    tokenData.hash = hash;
  } else if (contract === "BLOCKS") {
    tokenData.hashes = Array.isArray(hash) ? hash : [hash];
  } else {
    tokenData.hash = hash;
  }

  save("scriptData", {
    src: src.filter(Boolean),
    tokenIdHash: `let tokenData = ${JSON.stringify(tokenData)}`,
    process: extLib.startsWith("processing") ? "application/processing" : "",
    script,
  });
}

function getPlatform(contractName, projId) {
  const inline = platformByProject.get(contractName + projId);
  if (inline) return inline;

  if (["BLOCKS", "BLOCKS[2]", "BLOCKS[3]"].includes(contractName)) {
    if (curated.includes(projId)) return "Art Blocks Curated";
    if (playground.includes(projId)) return "Art Blocks Playground";
    return projId < 374 ? "Art Blocks Factory" : "Art Blocks Presents";
  }
  return registry[contractName]?.platform || (isStudio(contractName) ? "Art Blocks Studio" : "");
}

const getLibVersion = (extLib) =>
  Object.keys(libs).find((key) => key.startsWith(extLib.replace(/js$/, "") + "@")) || extLib;

const showExtDep = (dep) =>
  dep && !["ONCHAIN", "ART_BLOCKS_DEPENDENCY_REGISTRY"].includes(dep.dependency_type);

const getExtDepType = (dep, contract) =>
  contract === "MOMENTFLEX" || dep.dependency_type === "IPFS" ? "ipfs" : "arweave";

const editionTxt = (edition, minted) =>
  edition - minted > 0
    ? `${minted} / ${edition} Minted`
    : `${edition} Work${edition > 1 ? "s" : ""}`;

const createSection = (title, content) =>
  content ? `<div class="section"><p class="more">${title} <br> ${content}</p></div>` : "";

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

function updateUI({ contract, owner, ensName, extLib, detail, tokenId, platform, edition, minted, extDep }) {
  renderInfoTitle(`${detail[0]} #${shortId(tokenId)}${detail[1] ? ` / ${detail[1]}` : ""}`);

  const first = extDep[0];
  const showLib = extLib && !["js", "svg", "custom"].some((prefix) => extLib.startsWith(prefix));
  const libInfo = showLib
    ? escapeHTML(getLibVersion(extLib)) +
      (first?.cid && first.cid.length < 10 ? ` <br> ${escapeHTML(first.cid)}` : "")
    : "";
  const extInfo =
    showExtDep(first) || contract === "MOMENTFLEX"
      ? escapeHTML(getExtDepType(first, contract))
      : "";
  const dependencyInfo = [libInfo, extInfo].filter(Boolean).join(" <br> ");
  const website = safeUrl(detail[3]);

  const link = (title, href, label, copy) =>
    createSection(
      title,
      `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>
       ${copy ? `<span class="copy-txt" data-text="${escapeHTML(copy)}"><i class="fa-regular fa-copy"></i></span>` : ""}`,
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
         ${owner ? link("OWNER", `https://opensea.io/${owner}`, ensName || shortAddr(owner), owner) : ""}
         ${link("CONTRACT", `https://etherscan.io/address/${address}`, shortAddr(address), address)}
         ${copyVal("TOKEN ID", tokenId)}
       </div>
       <div class="column">
         ${website ? link("ARTIST WEBSITE", website, extractDomain(website)) : ""}
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
      ? `<script type="importmap">{ "imports": { "three": "${three167}" } }</script>`
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
          <body>${canvasAndScript}</body>
        </html>`;

    lastFrameHTML = html;
    dom.frame.srcdoc = html;
  } catch (error) {
    console.error("injectFrame:", error);
  }
}

function getToken(line, searchQuery) {
  const match = line?.match(/^([A-Z]+(?:\[\d+\])?)\s?(\d+).*?(\d+)\s*Work/);
  if (!match) return;

  const [, contract, projIdStr, tokenStr] = match;
  if (!registry[contract]) return console.error(`Unknown contract in collection line: ${contract}`);

  const numberMatch = searchQuery.match(/#\s*(\d+)/);
  const pick = numberMatch ? parseInt(numberMatch[1]) : Math.floor(Math.random() * parseInt(tokenStr));

  grabData(makeTokenId(parseInt(projIdStr), pick), contract);
  dom.search.value = "";
  listManager.reset();
  displayList(listManager.originalList);
}

function getRandom(source) {
  if (Array.isArray(source)) {
    const usable = source.filter((line) => registry[ov.parseListLine(line)?.contract]);
    if (usable.length) getToken(randomItem(usable), "");
  } else if (source && Object.keys(source).length) {
    update(source[randomItem(Object.keys(source))], { cancelPending: true });
  }
}

function exploreAlgo() {
  if (contractData.detail[0] === "Unigrids") return;

  const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
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
  const { minted, projId } = contractData;
  contractData.tokenId = makeTokenId(projId, (shortId(contractData.tokenId) + dir + minted) % minted);
  grabData(contractData.tokenId, contractData.contract, true);
}

function findCurrentCollectionLine(name) {
  return listManager.originalList.find((line) => {
    const p = ov.parseListLine(line);
    return p && p.contract === contractData?.contract && p.collection.trim() === name;
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
    const line = findCurrentCollectionLine(contractData.detail[0].trim());
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
  const input = dom.loopInput.value.trim();
  const interval = input === "" ? loopState.interval : parseInt(input, 10) * 60000;
  const invalid = !Number.isFinite(interval) || interval <= 0
    ? "Please enter a time in minutes."
    : action === "favLoop" && !Object.keys(favorite).length
      ? "Save a favorite first."
      : "";

  if (invalid) {
    alert(invalid);
    return updateLoopButton();
  }

  loopRandom(interval, action);
  dom.loopInput.value = "";
  dom.loopInput.placeholder = `${interval / 60000} min`;
  updateLoopButton();
}

function updateLoopButton() {
  const looping = loopState.isLooping === "true";
  $(".fa-repeat").style.display = looping ? "none" : "inline-block";
  $(".fa-circle-stop").style.display = looping ? "inline-block" : "none";
}

const favoriteKey = ({ contract, tokenId }) => `${contract}:${tokenId}`;

function saveOutput() {
  let content = lastFrameHTML;
  try {
    content = dom.frame.contentDocument?.documentElement?.outerHTML || content;
  } catch { /* cross-origin frame: fall back to the HTML we injected */ }
  if (!content) return;

  const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: `${contractData.detail[0].replace(/\s+/g, "-")}#${shortId(contractData.tokenId)}.html`,
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  favorite[favoriteKey(contractData)] = contractData;
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
    const data = favorite[key] || {};
    const name = data.detail?.[0] ?? key;
    const hasId = data.tokenId !== undefined && data.tokenId !== null;

    const row = document.createElement("p");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center";

    const label = document.createElement("span");
    label.className = "fav-item";
    label.textContent = hasId ? `${name} #${shortId(data.tokenId)}` : name;
    label.appendChild(Object.assign(document.createElement("span"), { textContent: data.detail?.[1] ?? "" }));

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

const clearDataStorage = () => ["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d));

const clearPanels = () =>
  [dom.overlay, dom.infobar, ...panels].forEach((el) => el.classList.remove("active"));

const togglePanel = (panel) => {
  panels.forEach((p) => (p !== panel ? p.classList.remove("active") : (p.scrollTop = 0)));
  const active = panel.classList.toggle("active");
  [dom.overlay, dom.infobar].forEach((el) => el.classList.toggle("active", active));
};

const bindPanelToggle = (el, panel, before) =>
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    before?.();
    togglePanel(panel);
  });

function alignFavMenu() {
  if (window.matchMedia("(max-width: 600px)").matches) {
    dom.favMenu.style.left = dom.favMenu.style.right = "";
    return;
  }
  const { right } = dom.favIcon.getBoundingClientRect();
  dom.favMenu.style.left = `${Math.max(10, right + 25 - dom.favMenu.offsetWidth)}px`;
  dom.favMenu.style.right = "auto";
}

const toggleSpin = (show = true) => {
  dom.spinner.style.display = show ? "block" : "none";
};

function setUIControls(skipOverlay = false) {
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
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = Object.assign(document.createElement("textarea"), { value: text });
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

function persistOverlay() {
  const saved = ov.saveOverlay(overlay);
  if (!saved) fail(dom.collectionStatus, "Could not save changes in this browser.");
  return saved;
}

if (pruned || overlayDirty) persistOverlay();

const manageButton = (action, label, attr = "data-action", extra = "") =>
  `<button type="button" class="manage-btn${extra ? ` ${extra}` : ""}" ${attr}="${action}">${label}</button>`;

function commitChanges(statusElement, message, { contracts = false } = {}) {
  if (!persistOverlay()) return false;
  refreshLibrary({ contracts });
  setManageStatus(statusElement, message);
  return true;
}

function populateManagementSelects() {
  const selected = dom.contractAbi.value;
  dom.contractAbi.innerHTML = Object.keys(abiProfiles)
    .filter((name) => !["PMPV0", "bm", "v1"].includes(name))
    .map((name) => `<option value="${name}">${name}</option>`)
    .join("");
  dom.contractAbi.value = selected && abiProfiles[selected] ? selected : "v3Flex";
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
  listManageEntries = ov.listEntries(list, overlay).filter((entry) => entry.kind !== "base");

  if (!listManageEntries.length) {
    dom.manageListRows.innerHTML = '<p class="manage-status">No local changes yet.</p>';
    return;
  }

  dom.manageListRows.innerHTML = listManageEntries
    .map((entry, index) => {
      const hidden = entry.kind === "removed" || ov.parseListLine(entry.line)?.hidden;
      const actions = hidden
        ? manageButton("unhide", "Unhide") + manageButton("remove", "Remove")
        : manageButton("edit", "Edit") + manageButton("hide", "Hide") + manageButton("remove", "Remove");

      return `<div class="manage-item ${entry.kind === "removed" ? "removed" : hidden ? "hidden" : ""}" data-entry-index="${index}">
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
  contractManageEntries = Object.keys(registry).filter(
    (key) => !frozenContracts.has(key) && contractKind(key) !== "bundled",
  );

  dom.contractSection.hidden = !contractManageEntries.length;
  dom.contractSectionLabel.textContent = `Contracts (${contractManageEntries.length})`;

  dom.manageContractRows.innerHTML = contractManageEntries
    .map((key, index) => {
      const { abi, address, platform, startProjId } = registry[key];
      return `<div class="manage-item" data-contract-index="${index}">
        <p class="manage-item-main">${escapeHTML(key)}
          <span class="manage-badge">${contractKind(key)}</span></p>
        <p class="manage-item-main">${abi} &bull; ${shortAddr(address)}${
          platform ? ` &bull; ${escapeHTML(platform)}` : ""
        }${startProjId !== undefined ? ` &bull; start ${startProjId}` : ""}</p>
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
  if (open) return setManageStatus(dom.collectionStatus, "");
  listEdit = null;
  dom.collectionForm.reset();
  dom.collectionTarget.textContent = "Edit collection";
}

function setContractFormOpen(open) {
  dom.contractForm.hidden = !open;
  dom.contractToggle.textContent = open ? "Cancel" : "+ Add contract";
  if (open) return setManageStatus(dom.contractStatus, "");
  contractEditKey = null;
  dom.contractForm.reset();
  dom.contractAbi.value = "v3Flex";
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

  listEdit = { parsed, original: entry.original, additionLine: entry.kind === "added" ? entry.line : null };

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
  if (!updateResults.length) {
    dom.manageUpdateResults.innerHTML = "";
    return;
  }

  const limit = 200;
  const rows = updateResults
    .slice(0, limit)
    .map((result, index) => {
      const isNew = result.kind === "new";
      const badge = isNew ? "new" : `${result.oldWorks} &rarr; ${result.newWorks} works`;
      return `<div class="manage-item" data-update-index="${index}">
        <p class="manage-item-main">${escapeHTML(result.line)}</p>
        <div class="manage-item-actions">
          <span class="manage-badge">${badge}</span>
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
  const applyLabel = kinds.size > 1 ? "Apply all" : kinds.has("new") ? "Add all" : "Update all";

  dom.manageUpdateResults.innerHTML = `${rows}${more}
    <div class="manage-row">
      ${manageButton("apply-all", `${applyLabel} (${updateResults.length})`, "data-update-action", "primary")}
    </div>`;
}

async function fetchStartingProjectId(address, abi) {
  try {
    const start = Number(await call(address, abiProfiles[abi], "startingProjectId", []));
    return Number.isFinite(start) ? start : 0;
  } catch {
    return 0;
  }
}

async function fetchProjectLines(contractName, { onLine, onProgress } = {}) {
  const config = registry[contractName];
  if (!config) throw new Error(`Unknown contract: ${contractName}`);

  const chainStart = isV3(contractName) ? await fetchStartingProjectId(config.address, config.abi) : 0;
  const start = Math.max(config.startProjId || 0, chainStart);
  const end = Number(await contractCall(contractName, "nextProjectId"));
  const ids = Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);

  for (let offset = 0; offset < ids.length; offset += FETCH_BATCH_SIZE) {
    const batchIds = ids.slice(offset, offset + FETCH_BATCH_SIZE);
    const results = await Promise.all(
      batchIds.map(async (id) => {
        try {
          const detail = await contractCall(contractName, "projectDetails", id.toString());
          return [detail, await contractCall(contractName, stateFn(contractName), id)];
        } catch {
          return null;
        }
      }),
    );

    results.forEach((result, i) => {
      if (!result) return;
      const [detail, token] = result;
      const noun = Number(token.invocations) === 1 ? "Work" : "Works";
      onLine?.(`${contractName}${batchIds[i]} # ${detail[0]} / ${detail[1]} # ${token.invocations} ${noun}`);
    });

    onProgress?.({ scanned: offset + batchIds.length, total: ids.length });
    if (offset + FETCH_BATCH_SIZE < ids.length) await sleep(FETCH_BATCH_DELAY);
  }
}

async function scanContract(name, known, currentEntries, onProgress) {
  const results = [];

  await fetchProjectLines(name, {
    onLine: (line) => {
      const result = ov.compareProjectLine(line, currentEntries);
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

  const known = ov.knownListIdentities(list, overlay);
  const currentEntries = ov.currentLibraryEntries(list, overlay);
  const contracts = Object.keys(registry).filter((key) => !frozenContracts.has(key));
  let failed = 0;

  try {
    for (const [i, key] of contracts.entries()) {
      setManageStatus(dom.updateStatus, `Checking ${key} (${i + 1}/${contracts.length})...`);

      try {
        updateResults.push(
          ...(await scanContract(key, known, currentEntries, ({ scanned, total, results }) => {
            const found = [
              [countKind(results, "new"), "new"],
              [countKind(results, "changed"), "changed"],
            ]
              .filter(([count]) => count)
              .map(([count, label]) => `${count} ${label}`);
            setManageStatus(
              dom.updateStatus,
              `${key}: ${scanned}/${total} checked${found.length ? ` (${found.join(", ")})` : ""}...`,
            );
          })),
        );
      } catch (error) {
        failed += 1;
        console.warn(`Update failed for ${key}:`, error);
      }

      await sleep(50);
    }

    renderUpdateResults();

    const suffix = failed ? ` ${failed} contract(s) could not be checked.` : "";
    const found = [
      [countKind(updateResults, "new"), "new collection(s)"],
      [countKind(updateResults, "changed"), "artwork count change(s)"],
    ]
      .filter(([count]) => count)
      .map(([count, label]) => `${count} ${label}`);

    setManageStatus(
      dom.updateStatus,
      found.length
        ? `Found ${found.join(" and ")}. Review them below.${suffix}`
        : `No new collections or artwork count changes.${suffix}`,
    );
  } finally {
    updateRunning = false;
    dom.manageUpdate.disabled = false;
  }
}

function bindCopyButton(button, getText, okMessage, failMessage) {
  button.addEventListener("click", async () => {
    const copied = await copyText(getText());
    setManageStatus(dom.copyStatus, copied ? okMessage : failMessage, !copied);
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
      if (!updateResults.length) return;
      const results = updateResults;
      updateResults = [];
      results.forEach((r) => ov.applyUpdateResult(overlay, r));
      commitChanges(dom.updateStatus, `Applied ${results.length} change(s).`);
      return renderUpdateResults();
    }

    const rowIndex = Number(button.closest("[data-update-index]")?.dataset.updateIndex);
    const result = updateResults[rowIndex];
    if (!result) return;
    updateResults.splice(rowIndex, 1);

    if (action === "apply") {
      ov.applyUpdateResult(overlay, result);
      commitChanges(dom.updateStatus, result.kind === "new" ? "Collection added." : "Artwork count updated.");
    }
    renderUpdateResults();
  });

  dom.contractSectionToggle.addEventListener("click", () => setContractSectionOpen(!contractSectionOpen));

  dom.contractToggle.addEventListener("click", () => {
    setContractFormOpen(dom.contractForm.hidden);
    setManageStatus(dom.contractStatus, "");
  });

  dom.manageListRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const entry = listManageEntries[Number(button?.closest("[data-entry-index]")?.dataset.entryIndex)];
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
    const works = Number(dom.collectionWorks.value);
    if (!collection) return fail(dom.collectionStatus, "Enter a collection name.");
    if (!Number.isInteger(works) || works < 0)
      return fail(dom.collectionStatus, "Enter a valid work count.");

    const line = ov.lineFromParsed(
      {
        ...listEdit.parsed,
        collection,
        artist: dom.collectionArtist.value.trim(),
        platform: dom.collectionPlatform.value.trim(),
      },
      works,
    );
    if (!ov.parseListLine(line))
      return fail(dom.collectionStatus, "Contract keys must be letters, optionally followed by [number].");

    if (listEdit.additionLine) ov.applyAdd(overlay, line, listEdit.additionLine);
    else ov.applyEdit(overlay, listEdit.original, line);

    if (commitChanges(dom.collectionStatus, "Collection saved.")) setCollectionFormOpen(false);
  });

  dom.manageContractRows.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    const key = contractManageEntries[Number(button?.closest("[data-contract-index]")?.dataset.contractIndex)];
    if (!key) return;

    if (button.dataset.action === "edit") return startContractEdit(key);

    const kind = contractKind(key);
    if (!confirm(`Remove ${key} from your overlay?`)) return;

    delete overlay.contracts[key];
    if (contractEditKey === key) setContractFormOpen(false);
    commitChanges(
      dom.contractStatus,
      kind === "custom" ? "Contract removed." : "Bundled contract restored.",
      { contracts: true },
    );
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
        key = keyFromSymbol(await call(config.address, symbolAbi, "symbol", []), (k) => !!registry[k]);
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

    overlay.contracts[key] = config;
    const message = contractEditKey
      ? "Contract updated."
      : `Contract added as ${key}. Press "Update list" to fetch its collections.`;
    if (commitChanges(dom.contractStatus, message, { contracts: true })) setContractFormOpen(false);
  });

  bindCopyButton(
    dom.manageCopyList,
    () => ov.exportListJS(list, overlay, Object.keys(registry)),
    "Full list JS copied. Replace list in js/data.js.",
    "Could not copy the list.",
  );

  bindCopyButton(
    dom.manageCopyContracts,
    () => ov.exportContractsJS(registry, Object.keys(baseContractRegistry)),
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
    [dom.collectionStatus, dom.contractStatus, dom.updateStatus].forEach((el) => setManageStatus(el, ""));
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
    const infobarTop = dom.infobar.getBoundingClientRect().top;

    dom.tooltip.textContent = text;
    dom.tooltip.style.visibility = "hidden";
    dom.tooltip.classList.add("active");

    const { width } = dom.tooltip.getBoundingClientRect();
    const left = Math.max(
      10 + width / 2,
      Math.min(window.innerWidth - 10 - width / 2, rect.left + rect.width / 2),
    );

    Object.assign(dom.tooltip.style, {
      left: `${left}px`,
      bottom: `${window.innerHeight - infobarTop + 10}px`,
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
  dom.tooltip.style.visibility = dom.tooltip.style.opacity = "";
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

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function setTheme(themeName) {
  dom.themeBtns.forEach((btn) => btn.setAttribute("data-active", btn.dataset.theme === themeName));
  dom.root.classList.toggle("dark-mode", themeName === "system" ? prefersDark.matches : themeName === "dark");
  localStorage.setItem("themePreference", themeName);
}

document.addEventListener("keypress", (event) => {
  if (event.key !== "\\") return;
  clearDataStorage();
  location.reload();
});

const bindSetting = (input, storageKey, normalize = (v) => v) =>
  input.addEventListener("keypress", (event) => {
    if (event.key !== "Enter") return;
    const raw = input.value.trim();
    const value = raw && normalize(raw);
    if (raw && !value) return alert("Please enter a valid gateway host.");
    if (value) localStorage.setItem(storageKey, value);
    else localStorage.removeItem(storageKey);
    location.reload();
  });

bindSetting(dom.rpcUrlInput, "rpcUrl");
bindSetting(dom.ipfsGateway, "ipfsGateway", parseGatewayHost);

dom.search.addEventListener("input", (event) => {
  const query = event.target.value.trim();
  const openList = () => {
    if (!dom.listPanel.classList.contains("active")) togglePanel(dom.listPanel);
  };

  if (query.startsWith("#") && contractData) {
    const num = query.substring(1);
    const line = /^\d*$/.test(num) ? findCurrentCollectionLine(contractData.detail[0].trim()) : null;

    if (!line) {
      listManager.reset();
      return clearPanels();
    }

    listManager.filteredList = [line];
    listManager.selectedIndex = 0;
    dom.listPanel.innerHTML = `<div>${listItemHTML(line, 0, num, true)}</div>`;
    return openList();
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
  const item = event.target.closest(".list-item");
  if (!item) return;
  listManager.selectedIndex = parseInt(item.dataset.index);
  const selected = listManager.getSelected();
  if (selected) getToken(selected, dom.search.value.trim());
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

loopTypes.forEach((type) => dom[`${type}Loop`].addEventListener("click", () => handleLoop(`${type}Loop`)));

dom.stopLoop.addEventListener("click", stopLoop);
dom.inc.addEventListener("click", () => stepTokenId(1));
dom.dec.addEventListener("click", () => stepTokenId(-1));
dom.randomButton.addEventListener("click", () => getRandom(listManager.originalList));
dom.explore.addEventListener("click", exploreAlgo);

panels.forEach((panel) => panel.addEventListener("click", (event) => event.stopPropagation()));

dom.panel.addEventListener("click", (event) => {
  const copyBtn = event.target.closest(".copy-txt");
  if (!copyBtn) return;

  copyText(copyBtn.dataset.text);

  const icon = copyBtn.querySelector("i");
  const swap = (from, to) => from.forEach((cls, i) => icon.classList.replace(cls, to[i]));
  swap(["fa-regular", "fa-copy"], ["fa-solid", "fa-check"]);
  setTimeout(() => swap(["fa-solid", "fa-check"], ["fa-regular", "fa-copy"]), 1000);
});

document.addEventListener("click", clearPanels);

dom.themeBtns.forEach((button) => button.addEventListener("click", () => setTheme(button.dataset.theme)));

prefersDark.addEventListener("change", (event) => {
  if (localStorage.getItem("themePreference") === "system") dom.root.classList.toggle("dark-mode", event.matches);
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
