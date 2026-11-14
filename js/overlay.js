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

export function parseListLine(line) {
  const value = asString(line).trim();
  if (!value) return null;

  const hidden = value.endsWith("!");
  const body = hidden ? value.slice(0, -1).trimEnd() : value;

  const parts = body.split(" # ");
  if (parts.length < 3) return null;

  const head = parts[0].trim().match(/^([A-Z]+)(\d+)$/);
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

  dropChanges(overlay, changeMatches("remove", "original", original));
  overlay.list.push({ type: "remove", original });
  return true;
}

export function restoreOriginal(overlay, original) {
  dropChanges(overlay, changeMatches("remove", "original", original));
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

const ROMAN_VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const ROMAN_PATTERN =
  /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

function splitRoman(key) {
  for (let i = 0; i <= key.length; i += 1) {
    const suffix = key.slice(i);
    if (!ROMAN_PATTERN.test(suffix)) continue;

    let value = 0;
    for (let j = 0; j < suffix.length; j += 1) {
      const current = ROMAN_VALUES[suffix[j]];
      value += current < (ROMAN_VALUES[suffix[j + 1]] ?? 0) ? -current : current;
    }
    return { prefix: key.slice(0, i), value };
  }

  return { prefix: key, value: 0 };
}

function makeKeyRank(baseKeys, keyOrder) {
  const keyRanks = new Map(baseKeys.map((key, index) => [key, index]));
  const romanKeys = baseKeys.map((key, index) => ({ index, ...splitRoman(key) }));

  return (key) => {
    if (keyRanks.has(key)) return keyRanks.get(key);

    const { prefix, value } = splitRoman(key);
    const family = romanKeys
      .filter((member) => member.prefix === prefix)
      .sort((a, b) => a.value - b.value);
    const lower = family.filter((member) => member.value < value).pop();
    const upper = family.find((member) => member.value > value);

    if (lower && upper) {
      const fraction = (value - lower.value) / (upper.value - lower.value);
      return lower.index + fraction * (upper.index - lower.index);
    }
    if (lower) {
      const gap = value - lower.value;
      return lower.index + gap / (gap + 1);
    }
    if (upper) {
      const gap = upper.value - value;
      return upper.index - gap / (gap + 1);
    }

    const position = keyOrder.indexOf(key);
    if (position !== -1) {
      for (let i = position - 1; i >= 0; i -= 1) {
        const rank = keyRanks.get(keyOrder[i]);
        if (rank !== undefined) return rank + 0.5;
      }
      for (let i = position + 1; i < keyOrder.length; i += 1) {
        const rank = keyRanks.get(keyOrder[i]);
        if (rank !== undefined) return rank - 0.5;
      }
    }

    const boundary = baseKeys.findIndex((baseKey) => key < baseKey);
    return boundary === -1 ? baseKeys.length + 0.5 : boundary - 0.5;
  };
}

function compareKeys(rankOf) {
  return (keyA, keyB) => {
    const rankA = rankOf(keyA);
    const rankB = rankOf(keyB);
    if (rankA !== rankB) return rankA - rankB;
    return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
  };
}

function orderedListEntries(entries, keyOrder) {
  const baseEntries = entries.filter((entry) => entry.kind !== "added");
  const additions = entries.filter((entry) => entry.kind === "added");

  const baseKeys = [];
  baseEntries.forEach((entry) => {
    const key = keyOfLine(entry.line);
    if (!baseKeys.includes(key)) baseKeys.push(key);
  });

  const byKey = compareKeys(makeKeyRank(baseKeys, keyOrder));
  const compare = (a, b) =>
    byKey(keyOfLine(a.line), keyOfLine(b.line)) ||
    parseListLine(a.line).projectId - parseListLine(b.line).projectId;

  const ordered = [...baseEntries];
  [...additions].sort(compare).forEach((addition) => {
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
  const entries = Object.entries(contracts);
  if (entries.length === 0) return "export const contractRegistry = {};";

  const byKey = compareKeys(makeKeyRank(keyOrder, keyOrder));
  const ordered = [...entries].sort(([keyA], [keyB]) => byKey(keyA, keyB));

  const body = ordered
    .map(([key, config]) => {
      const args = [`abi.${config.abi}`, JSON.stringify(config.address)];

      if (config.platform || config.startProjId !== undefined) {
        args.push(config.platform ? JSON.stringify(config.platform) : "undefined");
        if (config.startProjId !== undefined) args.push(String(config.startProjId));
      }

      return `  ${key}: reg(${args.join(", ")}),`;
    })
    .join("\n");

  return `export const contractRegistry = {\n${body}\n};`;
}
