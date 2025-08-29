// This module encapsulates all interactions with Ethereum.
// It uses the ethers.js library to create contract instances, fetch data,
// and handle the nuances between different contract versions (e.g., V2 vs. V3).

import { ethers } from "../vendor/ethers.min.js";
import { contractRegistry, is } from "../config/contracts.js";
import * as state from "./state.js";
import { toggleSpin, clearPanels } from "../ui/ui.js";

// The UI module is injected by the main script to avoid circular dependencies.
let ui;
export function init(uiModule) {
  ui = uiModule;
}

// The provider is configured once using the RPC URL from state.
const provider = new ethers.JsonRpcProvider(state.getRpcUrl());

// --- Contract Instances and Lookups ---

// Holds all instantiated ethers.js contract objects.
export const instance = [];
// Maps a contract's numerical index in the `instance` array to its string key (e.g., 0 -> "AB").
export const nameMap = {};
// Maps a contract's string key to its numerical index (e.g., "AB" -> 0) for quick lookups.
export const indexMap = {};

// Initialize contract instances and lookup maps for efficient access.
Object.keys(contractRegistry).forEach((key, index) => {
  const { abi, address } = contractRegistry[key];
  instance.push(new ethers.Contract(address, abi, provider));
  nameMap[index] = key;
  indexMap[key] = index;
});

// The main data fetching function. It orchestrates the retrieval of all
// necessary on-chain data for a given artwork and triggers a UI update.
// It operates in two modes:
// - Full fetch: Grabs all data for a new artwork from scratch.
// - Update only: Fetches only the minimal data needed when navigating
//   between artworks within the same collection (e.g., owner, hash).
export async function grabData(tokenId, contract, updateOnly = false) {
  try {
    toggleSpin();
    clearPanels();
    console.log("Contract:", contract, "Token Id:", tokenId);

    // "Update only" mode is a performance optimization for navigating within a collection.
    if (updateOnly) {
      const [hash, { owner, ensName }] = await Promise.all([
        fetchHash(tokenId, contract),
        fetchOwner(tokenId, contract),
      ]);

      const data = state.getContractData();
      data.tokenId = tokenId;
      data.contract = contract;
      data.hash = hash;
      data.owner = owner;
      data.ensName = ensName;

      state.setContractData(data);
      ui.update(...Object.values(data));
    } else {
      // Full fetch mode clears previous data and gets everything.
      state.clearDataStorage();

      const isV3 = is.v3.includes(nameMap[contract]);
      const [projectId, hash, { owner, ensName }] = await Promise.all([
        fetchProjectId(tokenId, contract),
        fetchHash(tokenId, contract),
        fetchOwner(tokenId, contract),
      ]);

      const projId = Number(projectId);
      const [projectInfo, detail, { edition, minted }] = await Promise.all([
        fetchProjectInfo(projId, contract, isV3),
        fetchProjectDetails(projId, contract),
        fetchEditionInfo(projId, contract, isV3),
      ]);

      const [script, extLib] = await Promise.all([
        constructScript(projId, projectInfo, contract),
        extractLibraryName(projectInfo),
      ]);

      let extDep = [];
      let ipfs = null;
      let arweave = null;

      // FLEX contracts have external dependencies that need to be fetched.
      if (is.flex.includes(nameMap[contract])) {
        const extDepCount = await fetchExtDepCount(projId, contract);
        if (extDepCount) {
          const fetchCIDsFn = isV3 ? fetchV3CIDs : fetchV2CIDs;
          [extDep, { ipfs, arweave }] = await Promise.all([
            fetchCIDsFn(projId, extDepCount, contract),
            fetchGateway(contract),
          ]);
          // IPFS gateway override.
          if (
            nameMap[contract] === "BMFLEX" ||
            nameMap[contract] === "NUMBER"
          ) {
            ipfs = "https://ipfs.io/ipfs";
          }
        }
      }

      const data = {
        tokenId,
        contract,
        projId,
        hash,
        script,
        detail,
        owner,
        ensName,
        extLib,
        edition,
        minted,
        extDep,
        ipfs,
        arweave,
      };

      state.setContractData(data);
      ui.update(...Object.values(data));
    }
  } catch (error) {
    console.error(`grabData (${updateOnly ? "update" : "full"})`, error);
    toggleSpin(false);
  }
}

// --- Single-Purpose Fetcher Functions ---

// Fetches a token's hash, handling the legacy Art Blocks contract variation.
async function fetchHash(tokenId, contract) {
  return nameMap[contract] == "AB"
    ? instance[contract].showTokenHashes(tokenId)
    : instance[contract].tokenIdToHash(tokenId);
}

// Fetches the project ID for a given token ID.
async function fetchProjectId(tokenId, contract) {
  return instance[contract].tokenIdToProjectId(tokenId);
}

// Fetches project script metadata, handling V2 vs. V3 contract differences.
async function fetchProjectInfo(projId, contract, isV3) {
  return isV3
    ? instance[contract].projectScriptDetails(projId)
    : instance[contract].projectScriptInfo(projId);
}

// Assembles the full artwork script from multiple parts, if necessary.
// Uses batching and a small delay to avoid overwhelming the RPC endpoint.
async function constructScript(projId, projectInfo, contract) {
  const scriptCount = Number(projectInfo.scriptCount);
  let fullScript = "";
  const batchSize = scriptCount > 30 ? 25 : scriptCount;
  for (let i = 0; i < scriptCount; i += batchSize) {
    const batchPromises = [];
    const batchEnd = Math.min(i + batchSize, scriptCount);
    for (let j = i; j < batchEnd; j++) {
      batchPromises.push(instance[contract].projectScriptByIndex(projId, j));
    }
    const batchScripts = await Promise.all(batchPromises);
    fullScript += batchScripts.join("");
    // Add a small delay between batches to be kind to the RPC endpoint.
    if (i + batchSize < scriptCount) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return fullScript;
}

// Fetches the core project details (name, artist, description, etc.).
async function fetchProjectDetails(projId, contract) {
  return instance[contract].projectDetails(projId);
}

// Fetches the owner of a token and attempts to resolve their ENS name.
// Falls back to null if the ENS lookup fails.
async function fetchOwner(tokenId, contract) {
  const owner = await instance[contract].ownerOf(tokenId);
  const ensName = await provider.lookupAddress(owner).catch(() => null);
  return { owner, ensName };
}

// Extracts the library name from project metadata, which can be stored
// in one of two different formats.
export function extractLibraryName(projectInfo) {
  if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
    return projectInfo[0].trim();
  } else {
    return JSON.parse(projectInfo[0]).type;
  }
}

// Fetches edition size and number of minted works, handling V2 vs. V3 differences.
async function fetchEditionInfo(projId, contract, isV3) {
  const invo =
    await instance[contract][isV3 ? "projectStateData" : "projectTokenInfo"](
      projId,
    );
  return {
    edition: Number(invo.maxInvocations),
    minted: Number(invo.invocations),
  };
}

// Fetches the number of external asset dependencies for a project.
async function fetchExtDepCount(projId, contract) {
  const count =
    await instance[contract].projectExternalAssetDependencyCount(projId);
  return count == 0 ? null : count;
}

// Fetches all external asset dependency definitions for a project.
async function fetchDependencies(projId, extDepCount, contract) {
  const cidPromises = Array.from({ length: Number(extDepCount) }, (_, i) =>
    instance[contract].projectExternalAssetDependencyByIndex(projId, i),
  );
  return Promise.all(cidPromises);
}

// Formats external dependency data for V2 contracts.
async function fetchV2CIDs(projId, extDepCount, contract) {
  const cidTuples = await fetchDependencies(projId, extDepCount, contract);
  return cidTuples.map((tuple) => ({
    cid: tuple[0],
    dependency_type: "IPFS",
    data: null,
    isOnchain: false,
  }));
}

// Formats external dependency data for V3 contracts, which can handle
// multiple types of dependencies (IPFS, Arweave, on-chain).
async function fetchV3CIDs(projId, extDepCount, contract) {
  const cidTuples = await fetchDependencies(projId, extDepCount, contract);
  return cidTuples.map((tuple) => {
    const cid = tuple.cid;
    const dependencyType = Number(tuple.dependencyType || 0);
    const bytecodeAddress = tuple.bytecodeAddress || "";
    const data = tuple.data || "";
    // On-chain dependencies store their data directly in the contract.
    if (dependencyType === 2) {
      let parsedData = {};
      try {
        if (data.startsWith("{")) {
          parsedData = JSON.parse(data);
        } else {
          parsedData = { raw: data };
        }
      } catch (error) {
        console.log("ONCHAIN data parsing error:", error);
        console.log("Raw ONCHAIN data:", data);
        parsedData = { raw: data };
      }
      return {
        cid: cid,
        dependency_type: "ONCHAIN",
        data: parsedData,
        bytecode_address: bytecodeAddress,
        isOnchain: true,
      };
    }
    // Other types are pointers to off-chain assets.
    return {
      cid: cid,
      dependency_type:
        dependencyType === 0
          ? "IPFS"
          : dependencyType === 1
            ? "ARWEAVE"
            : "ART_BLOCKS_DEPENDENCY_REGISTRY",
      data: null,
      isOnchain: false,
    };
  });
}

// Fetches the preferred IPFS and Arweave gateways for a contract.
async function fetchGateway(contract) {
  const [ipfs, arweave] = await Promise.all([
    instance[contract].preferredIPFSGateway(),
    instance[contract].preferredArweaveGateway(),
  ]);
  return { ipfs, arweave };
}
