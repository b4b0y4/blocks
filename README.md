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
  - ID number: Specific artwork from current collection

### Interface Features
- Search box with keyboard navigation (up/down arrows)
- Favorites system for saving and managing preferred artworks
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

#### Core Modules
- `/src/core/script.js`: Main entry point. Initializes all modules and wires up event listeners, connecting the UI to the application logic.
- `/src/core/state.js`: Manages the application's state, including the current artwork, user's favorites, and loop settings. It also handles persistence to `localStorage`.
- `/src/core/actions.js`: The application's "controller." It contains all the logic for handling user interactions, such as selecting a token, starting a loop, or saving an artwork.
- `/src/core/ethereum.js`: Handles all interactions with the Ethereum blockchain, such as fetching token data and contract details.

#### UI Modules
- `/src/ui/ui.js`: Main orchestration for all UI behavior — it now contains panel state management, info-panel rendering logic, and utility helpers.
- `/src/ui/dom.js`: DOM element references and event listener registrations. Centralizes all DOM queries and UI event handling.
- `/src/ui/frame.js`: Handles the creation and injection of content into a sandboxed iframe where the generative artwork is rendered.
- `/src/ui/lists-viewer.js`: Renders list-based views (collection lists and favorites) with keyboard navigation support.
- `/src/ui/theme.js`: Manages the application's visual theme (light/dark/system).
- `/src/ui/tooltips.js`: Handles the display of tooltips for UI elements.


#### Config Modules
- `/src/config/block-fetcher.js`: A developer utility used to fetch new collection data from contracts.
- `/src/config/contracts.js`: Contains contract definitions, addresses, and classifications.
- `/src/config/abis.js`: Stores ABI (Application Binary Interface) references for the contracts.
- `/src/config/genArtRef.js`: Contains curated collection data and references to JavaScript libraries used by the artworks.

### Adding New Contracts

1. In `/src/contracts.js`, add your contract data to `contractRegistry`.
2. Open the application in your browser and open the developer console.
3. In the console, you can now fetch blocks in several convenient ways:
    - **By variable (recommended):** `fetchBlocks(yourcontract)` (uses the lowercase version of your contract name)
    - **By string:** `fetchBlocks('YOURCONTRACT')` (case-insensitive)
    - **Multiple contracts:** `fetchBlocks([yourcontract, anothercontract])`
    - **Using predefined lists:** `fetchBlocks(is.studio)`
4. The console will output any new project lines found. Copy these entries and add them manually to the `list` array in `/src/genArtRef.js`.
    - Add a `!` to the end of any line to ignore it in the UI.
    - Example output format:
      ```js
      "YOURCONTRACT0 # Project Name / Artist Name # X Works",
      "YOURCONTRACT1 # Another Project / Another Artist # Y Works!", // '!' ignores this line
      ```

### Required Contract Functions

Your contract must implement these standard functions:
- `projectDetails(uint256)`
- `tokenIdToHash(uint256)` or `showTokenHashes(uint256)`
- `tokenIdToProjectId(uint256)`
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
