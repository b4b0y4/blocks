export const OVERLAY_KEY = "collectionOverlay";
export const OVERLAY_VERSION = 1;

const SEP = " | ";
const CONTRACT_KEY = /^[A-Z]+(?:\[\d+\])?$/;
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const asString = (v) => (typeof v === "string" ? v : "");

const drop = (overlay, match) => {
  overlay.list = overlay.list.filter((change) => !match(change));
};
const is = (type, field, value) => (change) => change.type === type && change[field] === value;

export const emptyOverlay = () => ({ version: OVERLAY_VERSION, list: [], contracts: {} });

export function parseListLine(line) {
  const value = asString(line).trim();
  const hidden = value.endsWith("!");
  const parts = (hidden ? value.slice(0, -1).trimEnd() : value).split(" # ");
  if (parts.length < 3) return null;

  const head = parts[0].trim().match(/^([A-Z]+(?:\[\d+\])?)(\d+)$/);
  const worksPart = parts.at(-1);
  const platformAt = worksPart.lastIndexOf(SEP);
  const tail = (platformAt === -1 ? worksPart : worksPart.slice(0, platformAt))
    .trim()
    .match(/^(\d+)\s+Works?$/);
  if (!head || !tail) return null;

  const label = parts.slice(1, -1).join(" # ").trim();
  const emptyArtist = label.endsWith(" /");
  const at = emptyArtist ? -1 : label.lastIndexOf(" / ");

  return {
    contract: head[1],
    projectId: Number(head[2]),
    collection: (emptyArtist ? label.slice(0, -2) : at < 0 ? label : label.slice(0, at)).trim(),
    artist: at < 0 ? "" : label.slice(at + 3).trim(),
    works: Number(tail[1]),
    platform: platformAt === -1 ? "" : worksPart.slice(platformAt + SEP.length).trim(),
    hidden,
  };
}

export const listIdentity = (line) => {
  const p = parseListLine(line);
  return p ? `${p.contract}${p.projectId}` : null;
};

export function makeListLine({
  contract, projectId, collection, artist = "", works, platform = "", hidden = false,
}) {
  const count = Number(works);
  const suffix = platform.trim() ? `${SEP}${platform.trim()}` : "";
  return `${contract}${projectId} # ${collection.trim()} / ${artist.trim()} # ${count} ${
    count === 1 ? "Work" : "Works"
  }${suffix}${hidden ? "!" : ""}`;
}

export function normalizeContractConfig(config) {
  if (!isObject(config)) return null;

  const abi = asString(config.abi).trim();
  const address = asString(config.address).trim();
  if (!abi || !/^0x[a-fA-F0-9]{40}$/.test(address)) return null;

  const raw = config.startProjId;
  const hasStart = raw != null && String(raw).trim() !== "";
  const startProjId = Number(raw);
  if (hasStart && (!Number.isInteger(startProjId) || startProjId < 0)) return null;

  return {
    abi,
    address,
    platform: asString(config.platform).trim(),
    ...(hasStart ? { startProjId } : {}),
  };
}

export function normalizeOverlay(data) {
  const overlay = emptyOverlay();
  if (!isObject(data)) return overlay;

  const edits = new Map();
  const removes = new Set();
  const additions = new Set();

  (Array.isArray(data.list) ? data.list : []).forEach((change) => {
    if (!isObject(change)) return;
    const line = asString(change.line);
    const original = asString(change.original);

    if (change.type === "add" && parseListLine(line)) additions.add(line);
    else if (change.type === "edit" && parseListLine(original) && parseListLine(line))
      edits.set(original, line);
    else if (change.type === "remove" && parseListLine(original)) removes.add(original);
  });

  overlay.list = [
    ...[...edits].map(([original, line]) => ({ type: "edit", original, line })),
    ...[...removes].map((original) => ({ type: "remove", original })),
    ...[...additions].map((line) => ({ type: "add", line })),
  ];

  if (isObject(data.contracts))
    Object.entries(data.contracts).forEach(([key, config]) => {
      const normalized = normalizeContractConfig(config);
      if (normalized && CONTRACT_KEY.test(key)) overlay.contracts[key] = normalized;
    });

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
    if (removes.has(original)) return { line: edited ?? original, original, kind: "removed" };
    return edited
      ? { line: edited, original, kind: "edited" }
      : { line: original, original, kind: "base" };
  });

  overlay.list.forEach((change) => {
    if (change.type === "add") entries.push({ line: change.line, original: null, kind: "added" });
  });

  return entries;
}

export function mergeList(baseList, overlay) {
  const seen = new Set();
  return listEntries(baseList, overlay).flatMap(({ line, kind }) => {
    if (kind === "removed" || seen.has(line)) return [];
    seen.add(line);
    return [line];
  });
}

export function applyAdd(overlay, line, previousLine = null) {
  if (!parseListLine(line)) return false;
  drop(overlay, (c) => c.type === "add" && (c.line === line || c.line === previousLine));
  overlay.list.push({ type: "add", line });
  return true;
}

export function applyEdit(overlay, original, line) {
  if (!parseListLine(original) || !parseListLine(line)) return false;
  drop(overlay, (c) => (c.type === "edit" || c.type === "remove") && c.original === original);
  if (line !== original) overlay.list.push({ type: "edit", original, line });
  return true;
}

export function applyRemove(overlay, original) {
  if (!parseListLine(original)) return false;
  restoreOriginal(overlay, original);
  overlay.list.push({ type: "remove", original });
  return true;
}

export const restoreOriginal = (overlay, original) =>
  drop(overlay, is("remove", "original", original));
export const removeEdit = (overlay, original) => drop(overlay, is("edit", "original", original));

const ENTRY_FIELDS = ["contract", "projectId", "collection", "artist", "works", "platform"];
const sameEntry = (a, b) => ENTRY_FIELDS.every((k) => a[k] === b[k]);

export function pruneReconciledChanges(overlay, baseList) {
  const known = new Set(baseList.map(listIdentity).filter(Boolean));
  const parsedBase = baseList.map(parseListLine).filter(Boolean);

  const isReconciled = (change) => {
    if (change.type === "add") return known.has(listIdentity(change.line));
    if (change.type === "edit") {
      const parsed = parseListLine(change.line);
      return Boolean(parsed && parsedBase.some((base) => sameEntry(parsed, base)));
    }
    return !baseList.includes(change.original);
  };

  const before = overlay.list.length;
  drop(overlay, isReconciled);
  return overlay.list.length !== before;
}

const bareLine = (line) => line.replace(/!\s*$/, "");

function setAdditionHidden(overlay, line, hidden) {
  if (!parseListLine(line)) return false;
  const bare = bareLine(line);
  const current =
    overlay.list.find((c) => c.type === "add" && bareLine(c.line) === bare)?.line ?? line;
  return applyAdd(overlay, hidden ? `${bare}!` : bare, current);
}

export const hideAddition = (overlay, line) => setAdditionHidden(overlay, line, true);
export const unhideAddition = (overlay, line) => setAdditionHidden(overlay, line, false);

const keyOfLine = (line) => parseListLine(line)?.contract ?? "";
const stemOf = (key) => key.replace(/\[\d+\]$/, "");
const numOf = (key) => Number(/\[(\d+)\]$/.exec(key)?.[1] ?? 0);

function makeKeyCompare(keyOrder) {
  const rank = (key) => {
    const i = keyOrder.findIndex((other) => stemOf(other) === stemOf(key));
    return i === -1 ? Infinity : i;
  };
  return (a, b) => rank(a) - rank(b) || numOf(a) - numOf(b) || (a < b ? -1 : a > b ? 1 : 0);
}

function orderedListEntries(entries, keyOrder) {
  const byKey = makeKeyCompare(keyOrder);
  const compare = (a, b) =>
    byKey(keyOfLine(a.line), keyOfLine(b.line)) ||
    parseListLine(a.line).projectId - parseListLine(b.line).projectId;

  const ordered = entries.filter((e) => e.kind !== "added");
  entries
    .filter((e) => e.kind === "added")
    .sort(compare)
    .forEach((addition) => {
      const index = ordered.findIndex((entry) => compare(addition, entry) < 0);
      ordered.splice(index === -1 ? ordered.length : index, 0, addition);
    });
  return ordered;
}

export function exportListJS(baseList, overlay, keyOrder = []) {
  const lines = new Set(
    orderedListEntries(listEntries(baseList, overlay), keyOrder).map(({ line, kind }) =>
      kind === "removed" && !line.endsWith("!") ? `${line}!` : line,
    ),
  );
  return `export const list = [\n${[...lines].map((l) => `  ${JSON.stringify(l)},`).join("\n")}\n];`;
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

export const lineFromParsed = (parsed, works = parsed.works) =>
  makeListLine({ ...parsed, works });

export function describeLine(line) {
  const p = parseListLine(line);
  if (!p) return { collection: "", artist: "", workCount: "" };
  return {
    collection: p.collection,
    artist: p.artist,
    workCount: `${p.works} ${p.works === 1 ? "Work" : "Works"}`,
  };
}

export function knownListIdentities(baseList, overlay) {
  const known = new Set();
  const remember = (line) => {
    const identity = listIdentity(line);
    if (identity) known.add(identity);
  };
  baseList.forEach(remember);
  overlay.list.forEach(({ line, original }) => {
    if (line) remember(line);
    if (original) remember(original);
  });
  return known;
}

export function currentLibraryEntries(baseList, overlay) {
  const entries = new Map();
  listEntries(baseList, overlay).forEach((entry) => {
    const identity = entry.kind === "removed" ? null : listIdentity(entry.line);
    if (identity) entries.set(identity, entry);
  });
  return entries;
}

export function compareProjectLine(line, currentEntries) {
  const identity = listIdentity(line);
  if (!identity) return null;

  const current = currentEntries.get(identity);
  if (!current) return { kind: "new", identity, line };

  const currentParsed = parseListLine(current.line);
  const nextParsed = parseListLine(line);
  if (!currentParsed || !nextParsed || currentParsed.works === nextParsed.works) return null;

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

export function applyUpdateResult(overlay, result) {
  if (result.kind === "new") return applyAdd(overlay, result.line);
  if (result.added) return applyAdd(overlay, result.line, result.previousLine);
  return applyEdit(overlay, result.original, result.line);
}
