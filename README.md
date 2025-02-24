# Blocks

A web-based viewer for generative art collections on the Ethereum blockchain, focusing on Art Blocks and associated Engine collections.

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
- `/` - Open search
- `\` - Clear current view
- `Enter` - Execute search with following behaviors:
  - Empty input: Display random artwork
  - Collection name: Random piece from that collection
  - Collection name #ID: Specific artwork
  - ID number: Specific artwork from current collection

### Interface Features
- Hidden menu in top-right corner for additional options
- Fullscreen viewing mode
- Dark/light theme toggle
- Automatic loop functionality
- Favorite artwork saving

## Development

### Adding New Contracts

To add new contracts to the viewer:

1. In `contracts.js`, add your contract data to `contractsData`:
```js
contractsData = {
  // ... existing contracts
  YOURCONTRACT: {
    abi: abiV3, // Choose from abiV1, abiV2, abiV3, abiV2FLEX, abiV3FLEX
    address: "0x...", // Contract address
    platform: "Your Platform", // Optional
    startProjId: 1, // Optional, default is 0
  }
}
```

2. The contract will be automatically categorized based on its ABI:
- V2 contracts (uses `isV2` array)
- Studio contracts (prefix with "ABS")
- FLEX contracts (uses FLEX ABIs)

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

MIT
