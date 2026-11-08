# Blocks

A web-based viewer for generative art collections on Ethereum, focusing on Art Blocks and Engine collections.

## Features

- View and interact with collections from:
  - Art Blocks (Curated, Presents, Explorations)
  - Art Blocks Collaborations (Pace, Bright Moments)
  - Engine Collections (Bright Moments, Plottables, etc.)
- Direct Ethereum blockchain integration
- Artwork information display
- Local HTML file saving
- Random artwork discovery
- Collection searching and filtering

## Getting Started

1. Visit the application at [blocks.baboya.eth](https://blocks.baboya.eth.limo)
2. Connect your RPC URL (e.g., from [Alchemy](https://alchemy.com))
3. Start exploring!

## Navigation

### Keyboard Controls
- `\` - Clear current view
- `Enter` - Execute search with following behaviors:
  - Empty input: Display random artwork
  - Collection name: Random piece from that collection
  - Collection name #ID: Specific artwork
  - #ID number: Specific artwork from current collection

### Interface Features
- Search box with keyboard navigation (up/down arrows)
- Browser-local library editor for adding, editing, hiding, and restoring collections
- Add custom contracts from the UI without editing source files
- Bookmark menu to save the current artwork or open the favorites list
- Multiple loop modes:
  - Everything: Random artwork from all collections
  - Favorites: Cycles through saved favorites
  - Curated: Art Blocks Curated collections only
  - Selected: Random pieces from current collection
  - OOB: Out of bounds exploration (hash variations)
- Copy functionality for contract addresses and token IDs
- Responsive design for mobile devices
- System/Light/Dark theme options

## Development

### Code Structure

- `js/script.js` : Main application logic and UI interactions
- `js/rpc.js` : Minimal eth_call client + ABI codec + ENS (no ethers dependency)
- `js/constants.js` : Contract definitions and classification
- `js/data.js` : Collection data and library references
- `js/overlay.js` : Browser-local collection/contract overlay and merge helpers

### Editing the Library in the UI

The app can edit the collection list and add contracts without touching the source
files. Changes are stored as an **overlay** in `localStorage` and merged with the
bundled list from `js/data.js` and the contract registry from `js/constants.js`
at runtime.

1. Open Settings and choose **Open library editor**.
2. Press **Update list** to check all active contracts (studio, engine, and
   custom). It finds new collections and also compares the artwork count of
   every project already in the list.
   - results are shown under the button; use **Add**, **Update**, or **Apply
     all** to put them into the overlay
   - entries removed from the list are left alone
   - every project is read to compare its artwork count, so the check can take
     longer than a missing-project-only scan
   - frozen legacy contracts (legacy Art Blocks and Bright Moments) are skipped
     automatically
3. The **shadow list** below shows only entries added or changed in this
   browser — the bundled `data.js` list is not repeated there.
   - use **Edit** on a row to change its name, artist, or artwork count
   - use **Hide** to remove an entry from the viewer, or **Unhide** to bring it
     back; hiding keeps any pending artwork-count update, so unhiding brings
     back the updated entry
   - entries added by an update can be edited, hidden, or unhidden too
4. Press **+ Add contract** next to **Update list** to add a contract by key,
   ABI profile (`v2`, `v3`, `v2Flex`, `v3Flex`), address,
   platform, and optional start project ID. Custom contracts appear inline and
   can be edited or removed. After adding one, press **Update list** to fetch its
   collections. Use the **Contracts (N)** header to collapse the contract list
   when it gets long.
5. Use **Copy list JS** / **Copy contracts JS** to make changes permanent:
   - paste the list output into the `list` array in `js/data.js`
   - new collections are inserted into their contract's block, in project order
   - hidden entries are written with a trailing `!`, so they stay hidden
   - paste the contract output into `contractRegistry` in `js/constants.js`
6. **Reset changes** clears the browser-local overlay.

Overlay changes apply immediately to search, Random, Favorites, and loop modes.
They are browser-local and are not committed to the repository automatically.
Contract keys must contain letters only because collection lines use the
`KEY<projectId>` format. Studio contracts use keys starting with `ABS`;
every other key is treated as an engine contract.

### Adding New Contracts

1. In `js/constants.js`, add your contract with the `reg` helper:
   ```js
   YOURCONTRACT: reg(abi.v3Flex, "0xYourAddress", "Platform Name", startProjId),
   ```
   - ABI must already exist in `abi` (e.g. `abi.v1`, `abi.v2`, `abi.v3`, `abi.v2Flex`, `abi.v3Flex`), or add one first.
   - `platform` and `startProjId` are optional (omit by not passing them).
2. Open the application in your browser and open the developer console.
3. In the console, you can now fetch blocks in several convenient ways:
    - **By variable:** `fetchBlocks(yourcontract)` (uses the lowercase version of your contract name)
    - **Multiple contracts:** `fetchBlocks(yourcontract, anothercontract)`
    - **Using predefined lists:** `fetchBlocks(is.studio)`
4. The console will output any new project lines and artwork count changes found.
   Copy new entries into the `list` array in `js/data.js`; for count changes,
   replace the existing line with the updated one.
    - Add a `!` to the end of any line to ignore it in the UI.
    - Example output format:
      ```js
      "YOURCONTRACT0 # Project Name / Artist Name # X Works",
      "YOURCONTRACT1 # Another Project / Another Artist # Y Works!", // '!' ignores this line
      ```

### Required Contract Functions

The contract must implement these standard functions:
- `nextProjectId()`
- `projectDetails(uint256)`
- `tokenIdToHash(uint256)` or `showTokenHashes(uint256)`
- `projectScriptInfo(uint256)` or `projectScriptDetails(uint256)`
- `projectScriptByIndex(uint256, uint256)`
- `ownerOf(uint256)`
- `projectTokenInfo(uint256)` or `projectStateData(uint256)`

For FLEX contracts, additional functions:
- `projectExternalAssetDependencyCount(uint256)`
- `projectExternalAssetDependencyByIndex(uint256, uint256)`
- `preferredIPFSGateway()` (optional)
- `preferredArweaveGateway()` (optional)

## Supporting Decentralization

Help maintain the application's decentralized nature by pinning it to your IPFS node.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
