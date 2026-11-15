# Blocks

A web viewer for generative art on Ethereum, focused on Art Blocks and Engine collections. It reads directly from the chain through your own RPC URL. No backend, no dependency.

## Getting Started

1. Open [blocks.baboya.eth](https://blocks.baboya.eth.limo).
2. Open Settings and enter an RPC URL (e.g. from [Alchemy](https://alchemy.com)).
3. Search for a collection or press Enter for a random artwork.

## Usage

**Search box**

| Input | Result |
| --- | --- |
| *(empty)* + `Enter` | Random artwork |
| `Collection` + `Enter` | Random piece from that collection |
| `Collection #123` + `Enter` | That specific piece |
| `#123` | Piece 123 of the current collection |
| `curated` + `Enter` | Random Art Blocks Curated piece |

Use the up/down arrows to move through results. Press `\` to clear the stored artwork and reload.

**Other controls**

- Previous / next artwork, and a random button.
- Explore (OOB): same algorithm with a random hash.
- Loop modes: Everything, Favorites, Curated, Selected (current collection), OOB.
- Bookmark menu: save the current artwork (also downloads it as an HTML file) or open your favorites.
- Copy buttons for the contract address and token ID.
- System, light and dark themes.

## Library Editor

Open **Settings → Open library editor** to change the collection list and contracts without editing source files. Changes are stored as an overlay in your browser's `localStorage` and merged with `js/data.js` and `js/constants.js` at runtime. They apply immediately to search, random, favorites and loops.

**Update the list**

Press **Update list** to scan all active contracts. It finds new collections and artwork count changes. Use **Add**, **Update** or **Apply all** to accept them. Frozen legacy contracts are skipped, and entries you removed are left alone.

**Edit the list**

The shadow list shows only entries you added or changed:

- **Edit**: name, artist, platform, artwork count.
- **Hide / Unhide**: remove an entry from the viewer without losing it.
- **Remove**: delete an added entry, or discard your edit to a bundled one.

**Add a contract**

Press **+ Add contract**, then choose an ABI profile, an address and an optional platform. The key is generated from the contract's `symbol()`, with a `[2]`, `[3]`… suffix on collisions. Keys are letters plus an optional `[n]`, because list lines use the `KEY<projectId>` format.

For `v3` contracts the start project ID is read from `startingProjectId()`. The optional **Start project ID** field overrides it (useful to skip placeholder projects). After adding a contract, press **Update list** to fetch its collections.

**Make changes permanent**

Overlay changes are local to your browser. To commit them:

1. **Copy list** → replace the `list` array in `js/data.js`.
2. **Copy contracts** → replace the whole `contractRegistry` block in `js/constants.js`.

**Reset changes** clears the overlay.

## Editing the Source Directly

Add a contract in `js/constants.js`:

```js
YOURCONTRACT: reg("v3Flex", "0xYourAddress", "Platform Name"),
```

- The ABI profile must already exist (`v1`, `v2`, `v3`, `v2Flex`, `v3Flex`), or add one first.
- `platform` is optional.
- An optional fourth argument, `startProjId`, skips leading projects. The larger of it and `startingProjectId()` wins.

Then use **Update list** and **Copy list**, or write lines by hand in `js/data.js`:

```js
"YOURCONTRACT0 # Project Name / Artist Name # 10 Works",
"YOURCONTRACT1 # Hidden Project / Artist Name # 5 Works!",       // trailing ! hides it
"YOURCONTRACT2 # Third Project / Artist Name # 8 Works | Platform", // optional platform
```

## Contract Requirements

Every contract needs:

- `nextProjectId()`
- `projectDetails(uint256)`
- `tokenIdToHash(uint256)` or `showTokenHashes(uint256)`
- `projectScriptInfo(uint256)` or `projectScriptDetails(uint256)`
- `projectScriptByIndex(uint256, uint256)`
- `ownerOf(uint256)`
- `projectTokenInfo(uint256)` or `projectStateData(uint256)`

`v3` contracts should also expose `startingProjectId()`. Without it, scanning starts at 0 (or at the configured `startProjId`).

Flex contracts also need:

- `projectExternalAssetDependencyCount(uint256)`
- `projectExternalAssetDependencyByIndex(uint256, uint256)`
- `preferredIPFSGateway()`
- `preferredArweaveGateway()`

## Code Structure

- `js/script.js`: app logic and UI
- `js/rpc.js`: minimal `eth_call` client, ABI codec and ENS lookup
- `js/constants.js`: contract registry and ABI profiles
- `js/data.js`: bundled collection list and library references
- `js/overlay.js`: browser-local overlay and merge helpers

## Supporting Decentralization

Help keep the app decentralized by pinning it to your IPFS node.

## License

MIT. See [LICENSE](LICENSE).
