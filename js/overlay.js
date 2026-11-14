export const OVERLAY_KEY = "collectionOverlay";
export const OVERLAY_VERSION = 1;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const asString = (value) => (typeof value === "string" ? value : "");

const dropChanges = (overlay, match) => {
  overlay.list = overlay.list.filter((change) => !match(change));
};
const changeMatches = (type, field, value) => (change) =>
  change.type === type && change[field] === value;

export function emptyOverlay() {
  return { version: OVERLAY_VERSION, list: [], contracts: {} };
}

const PLATFORM_SEPARATOR = " | ";
const CONTRACT_KEY = /^[A-Z]+(?:\[\d+\])?$/;

export function parseListLine(line) {
  const value = asString(line).trim();
  if (!value) return null;

  const hidden = value.endsWith("!");
  const body = hidden ? value.slice(0, -1).trimEnd() : value;

  const parts = body.split(" # ");
  if (parts.length < 3) return null;

  const head = parts[0].trim().match(/^([A-Z]+(?:\[\d+\])?)(\d+)$/);
  const worksPart = parts[parts.length - 1];
  const platformAt = worksPart.lastIndexOf(PLATFORM_SEPARATOR);
  const worksText =
    platformAt === -1 ? worksPart : worksPart.slice(0, platformAt);
  const platform =
    platformAt === -1
      ? ""
      : worksPart.slice(platformAt + PLATFORM_SEPARATOR.length).trim();
  const works = worksText.trim().match(/^(\d+)\s+Works?$/);
  if (!head || !works) return null;

  const label = parts.slice(1, -1).join(" # ").trim();
  const labelParts = label.split(" / ");
  const artist =
    labelParts.length > 1 ? labelParts[labelParts.length - 1].trim() : "";
  const collection =
    labelParts.length > 1
      ? labelParts.slice(0, -1).join(" / ").trim()
      : labelParts[0].trim();

  return {
    contract: head[1],
    projectId: Number(head[2]),
    collection,
    artist,
    works: Number(works[1]),
    platform,
    hidden,
  };
}

export const listIdentity = (line) => {
  const parsed = parseListLine(line);
  return parsed ? `${parsed.contract}${parsed.projectId}` : null;
};

export function makeListLine({
  contract,
  projectId,
  collection,
  artist = "",
  works,
  platform = "",
  hidden = false,
}) {
  const count = Number(works);
  const trimmedPlatform = platform.trim();
  const suffix = trimmedPlatform
    ? `${PLATFORM_SEPARATOR}${trimmedPlatform}`
    : "";
  return `${contract}${projectId} # ${collection.trim()} / ${artist.trim()} # ${count} ${
    count === 1 ? "Work" : "Works"
  }${suffix}${hidden ? "!" : ""}`;
}

export function normalizeContractConfig(config) {
  if (!isObject(config)) return null;

  const abi = asString(config.abi).trim();
  const address = asString(config.address).trim();
  const platform = asString(config.platform).trim();
  if (!abi || !/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

  let startProjId;
  if (
    config.startProjId !== undefined &&
    config.startProjId !== null &&
    config.startProjId !== ""
  ) {
    startProjId = Number(config.startProjId);
    if (!Number.isInteger(startProjId) || startProjId < 0) return null;
  }

  return {
    abi,
    address,
    platform,
    ...(startProjId !== undefined ? { startProjId } : {}),
  };
}

export function normalizeOverlay(data) {
  const overlay = emptyOverlay();
  if (!isObject(data)) return overlay;

  if (Array.isArray(data.list)) {
    const edits = new Map();
    const removes = new Set();
    const additions = [];

    data.list.forEach((change) => {
      if (!isObject(change)) return;

      if (change.type === "add") {
        const line = asString(change.line);
        if (parseListLine(line) && !additions.includes(line)) additions.push(line);
      } else if (change.type === "edit") {
        const original = asString(change.original);
        const line = asString(change.line);
        if (parseListLine(original) && parseListLine(line)) edits.set(original, line);
      } else if (change.type === "remove") {
        const original = asString(change.original);
        if (parseListLine(original)) removes.add(original);
      }
    });

    edits.forEach((line, original) => {
      overlay.list.push({ type: "edit", original, line });
    });
    removes.forEach((original) => overlay.list.push({ type: "remove", original }));
    additions.forEach((line) => overlay.list.push({ type: "add", line }));
  }

  if (isObject(data.contracts)) {
    Object.entries(data.contracts).forEach(([key, config]) => {
      const normalized = normalizeContractConfig(config);
      if (normalized && CONTRACT_KEY.test(key)) overlay.contracts[key] = normalized;
    });
  }

  return overlay;
}

export function loadOverlay(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(OVERLAY_KEY);
    return raw ? normalizeOverlay(JSON.parse(raw)) : emptyOverlay();
  } catch {
    return emptyOverlay();
  }
}

export function saveOverlay(overlay, storage = globalThis.localStorage) {
  try {
    storage?.setItem(OVERLAY_KEY, JSON.stringify(normalizeOverlay(overlay)));
    return true;
  } catch {
    return false;
  }
}

export function listEntries(baseList, overlay) {
  const edits = new Map();
  const removes = new Set();

  overlay.list.forEach((change) => {
    if (change.type === "edit") edits.set(change.original, change.line);
    else if (change.type === "remove") removes.add(change.original);
  });

  const entries = baseList.map((original) => {
    const edited = edits.get(original);
    if (removes.has(original))
      return { line: edited ?? original, original, kind: "removed" };
    if (edited) return { line: edited, original, kind: "edited" };
    return { line: original, original, kind: "base" };
  });

  overlay.list.forEach((change) => {
    if (change.type === "add")
      entries.push({ line: change.line, original: null, kind: "added" });
  });

  return entries;
}

export function mergeList(baseList, overlay) {
  const merged = [];
  const seen = new Set();

  listEntries(baseList, overlay).forEach(({ line, kind }) => {
    if (kind === "removed" || seen.has(line)) return;
    seen.add(line);
    merged.push(line);
  });

  return merged;
}

export function applyAdd(overlay, line, previousLine = null) {
  if (!parseListLine(line)) return false;
  dropChanges(
    overlay,
    (change) =>
      change.type === "add" &&
      (change.line === line || change.line === previousLine),
  );
  overlay.list.push({ type: "add", line });
  return true;
}

export function applyEdit(overlay, original, line) {
  if (!parseListLine(original) || !parseListLine(line)) return false;

  dropChanges(
    overlay,
    (change) =>
      (change.type === "edit" || change.type === "remove") &&
      change.original === original,
  );

  if (line !== original) overlay.list.push({ type: "edit", original, line });
  return true;
}

export function applyRemove(overlay, original) {
  if (!parseListLine(original)) return false;

  dropChanges(overlay, changeMatches("remove", "original", original));
  overlay.list.push({ type: "remove", original });
  return true;
}

export function restoreOriginal(overlay, original) {
  dropChanges(overlay, changeMatches("remove", "original", original));
}

export function removeEdit(overlay, original) {
  dropChanges(overlay, changeMatches("edit", "original", original));
}

export function removeAddition(overlay, line) {
  dropChanges(overlay, changeMatches("add", "line", line));
}

export function pruneReconciledAdditions(overlay, baseList) {
  const known = new Set(baseList.map(listIdentity).filter(Boolean));
  const countBefore = overlay.list.length;

  overlay.list = overlay.list.filter(
    (change) =>
      change.type !== "add" || !known.has(listIdentity(change.line)),
  );

  return overlay.list.length !== countBefore;
}

const bareAdditionLine = (line) => line.replace(/!\s*$/, "");

export function hideAddition(overlay, line) {
  return setAdditionHidden(overlay, line, true);
}

export function unhideAddition(overlay, line) {
  return setAdditionHidden(overlay, line, false);
}

function setAdditionHidden(overlay, line, hidden) {
  if (!parseListLine(line)) return false;

  const bare = bareAdditionLine(line);
  const current =
    overlay.list.find(
      (change) =>
        change.type === "add" && bareAdditionLine(change.line) === bare,
    )?.line ?? line;

  return applyAdd(overlay, hidden ? `${bare}!` : bare, current);
}

const keyOfLine = (line) => parseListLine(line)?.contract ?? "";
const stemOf = (key) => key.replace(/\[\d+\]$/, "");
const numOf = (key) => Number(/\[(\d+)\]$/.exec(key)?.[1] ?? 0);

function makeKeyCompare(keyOrder) {
  const rank = (key) => {
    const i = keyOrder.findIndex((other) => stemOf(other) === stemOf(key));
    return i === -1 ? Infinity : i;
  };
  return (a, b) =>
    rank(a) - rank(b) || numOf(a) - numOf(b) || (a < b ? -1 : a > b ? 1 : 0);
}

function orderedListEntries(entries, keyOrder) {
  const byKey = makeKeyCompare(keyOrder);
  const compare = (a, b) =>
    byKey(keyOfLine(a.line), keyOfLine(b.line)) ||
    parseListLine(a.line).projectId - parseListLine(b.line).projectId;

  const ordered = entries.filter((entry) => entry.kind !== "added");
  entries
    .filter((entry) => entry.kind === "added")
    .sort(compare)
    .forEach((addition) => {
      const index = ordered.findIndex((entry) => compare(addition, entry) < 0);
      ordered.splice(index === -1 ? ordered.length : index, 0, addition);
    });

  return ordered;
}

export function exportListJS(baseList, overlay, keyOrder = []) {
  const seen = new Set();
  const lines = [];

  orderedListEntries(listEntries(baseList, overlay), keyOrder).forEach(
    ({ line, kind }) => {
      const output =
        kind === "removed" && !line.endsWith("!") ? `${line}!` : line;
      if (seen.has(output)) return;
      seen.add(output);
      lines.push(output);
    },
  );

  return `export const list = [\n${lines
    .map((line) => `  ${JSON.stringify(line)},`)
    .join("\n")}\n];`;
}

export function exportContractsJS(contracts = {}, keyOrder = []) {
  const byKey = makeKeyCompare(keyOrder);
  const body = Object.entries(contracts)
    .sort(([a], [b]) => byKey(a, b))
    .map(([key, { abi, address, platform, startProjId }]) => {
      const args = [JSON.stringify(abi), JSON.stringify(address)];
      if (platform || startProjId !== undefined) {
        args.push(platform ? JSON.stringify(platform) : "undefined");
        if (startProjId !== undefined) args.push(String(startProjId));
      }
      const name = /^[A-Z]+$/.test(key) ? key : JSON.stringify(key);
      return `  ${name}: reg(${args.join(", ")}),`;
    })
    .join("\n");

  return `export const contractRegistry = {\n${body}\n};`;
}
