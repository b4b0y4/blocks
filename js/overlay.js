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

export function parseListLine(line) {
  const value = asString(line).trim();
  if (!value) return null;

  const hidden = value.endsWith("!");
  const body = hidden ? value.slice(0, -1).trimEnd() : value;
  const parts = body.split(" # ");
  if (parts.length < 3) return null;

  const head = parts[0].trim().match(/^([A-Z]+)(\d+)$/);
  const works = parts[parts.length - 1].trim().match(/^(\d+)\s+Works?$/);
  if (!head || !works) return null;

  const label = parts.slice(1, -1).join(" # ").trim();
  const labelParts = label.split(" / ");
  const artist =
    labelParts.length > 1 ? labelParts[labelParts.length - 1].trim() : "";
  const collection =
    labelParts.length > 1
      ? labelParts
          .slice(0, -1)
          .join(" / ")
          .trim()
      : labelParts[0].trim();

  return {
    contract: head[1],
    projectId: Number(head[2]),
    collection,
    artist,
    works: Number(works[1]),
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
  hidden = false,
}) {
  const count = Number(works);
  return `${contract}${projectId} # ${collection.trim()} / ${artist.trim()} # ${count} ${
    count === 1 ? "Work" : "Works"
  }${hidden ? "!" : ""}`;
}

export function normalizeContractConfig(config) {
  if (!isObject(config)) return null;

  const abi = asString(config.abi).trim();
  const address = asString(config.address).trim();
  const platform = asString(config.platform).trim();
  if (!abi || !/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

  let startProjId;
  if (config.startProjId !== undefined && config.startProjId !== null && config.startProjId !== "") {
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
      if (normalized && /^[A-Z]+$/.test(key)) overlay.contracts[key] = normalized;
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

  // Keep any pending edit so hiding and restoring does not discard it.
  dropChanges(overlay, changeMatches("remove", "original", original));
  overlay.list.push({ type: "remove", original });
  return true;
}

export function restoreOriginal(overlay, original) {
  // Unhide only; keep an edit made to the entry.
  dropChanges(overlay, changeMatches("remove", "original", original));
}

export function removeAddition(overlay, line) {
  dropChanges(overlay, changeMatches("add", "line", line));
}

export function exportListJS(baseList, overlay) {
  const merged = mergeList(baseList, overlay);
  return `export const list = [\n${merged
    .map((line) => `  ${JSON.stringify(line)},`)
    .join("\n")}\n];`;
}

export function exportContractsJS(overlay) {
  const entries = Object.entries(overlay.contracts);
  if (entries.length === 0) return "// No custom contracts or overrides.";

  return entries
    .map(([key, config]) => {
      const args = [`abi.${config.abi}`, JSON.stringify(config.address)];

      if (config.platform || config.startProjId !== undefined) {
        args.push(config.platform ? JSON.stringify(config.platform) : "undefined");
        if (config.startProjId !== undefined) args.push(String(config.startProjId));
      }

      return `  ${key}: reg(${args.join(", ")}),`;
    })
    .join("\n");
}
