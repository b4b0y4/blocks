// Fetches and displays new blockchain art projects from Art Blocks contracts.
// Compares against existing list to identify new items and displays them
// with colored console output. Supports batch processing for performance.

import { instance, indexMap } from "./ethereum.js";
import { contractRegistry, is } from "./contracts.js";
import { list } from "./lists.js";

// Fetches new blocks for specified contracts and displays them
async function blocks(array) {
  for (const contractName of array) {
    const n = indexMap[contractName];
    const start = contractRegistry[contractName].startProjId || 0;
    const end = Number(await instance[n].nextProjectId());
    const newBlocks = [];
    const BATCH = 20; // Process projects in batches to avoid overwhelming the network

    // Process projects in batches for better performance
    for (let id = start; id < end; id += BATCH) {
      const batchPromises = [];

      // Create promises for each project in the current batch
      for (let batchId = id; batchId < Math.min(id + BATCH, end); batchId++) {
        batchPromises.push(
          Promise.all([
            instance[n].projectDetails(batchId.toString()),
            // Use different method based on contract version
            is.v3.includes(contractName)
              ? instance[n].projectStateData(batchId)
              : instance[n].projectTokenInfo(batchId),
          ]).catch(() => null), // Return null on error to avoid failing entire batch
        );
      }

      const results = await Promise.all(batchPromises);

      // Process batch results and format new items
      results.forEach((result, idx) => {
        if (result) {
          const [detail, token] = result;
          const newItem = `${contractName}${id + idx} # ${detail[0]} / ${detail[1]} # ${token.invocations} ${Number(token.invocations) === 1 ? "Work" : "Works"}`;

          // Only add if not already in the list (ignoring exclamation marks)
          if (!list.map((item) => item.replace(/!$/, "")).includes(newItem)) {
            newBlocks.push(`"${newItem}",`);
          }
        }
      });
    }

    // Display results with colored console output
    if (newBlocks.length > 0) {
      console.log(`%cNew items for ${contractName}:`, "color: #4C6F6F;");
      console.log(`%c${newBlocks.join("\n")}`, "color: #FAC085");
    } else {
      console.log(`%cNo new items for ${contractName}.`, "color: #666666;");
    }
  }
}

// Expose utilities to window for console convenience
window.is = is;
Object.keys(contractRegistry).forEach((contractName) => {
  window[contractName.toLowerCase()] = contractName;
});

// Main public function for fetching blocks
window.fetchBlocks = async (contracts) => {
  let contractArray;

  // Handle both string and array inputs
  if (typeof contracts === "string") {
    contractArray = [contracts.toUpperCase()];
  } else if (Array.isArray(contracts)) {
    contractArray = contracts;
  } else {
    console.error(
      "Please provide a contract name (string) or an array of contract names.",
    );
    console.log("Example: fetchBlocks('newrafael') or fetchBlocks(newrafael)");
    console.log("Or for multiple: fetchBlocks(['NEWRAFAEL', 'ABC'])");
    return;
  }

  if (contractArray.length === 0) {
    console.error("The contract array is empty.");
    return;
  }

  console.log(
    `%cFetching blocks for:%c ${contractArray.join(", ")}`,
    "color: #DF7543;",
    "color: #666666;",
  );

  await blocks(contractArray);
  console.log("%cDone fetching!", "color: #DF7543;");
};

// Module initialization messages
console.log("Block-fetcher module loaded. Usage:");
console.log("  fetchBlocks('CONTRACT_NAME') - string literal");
console.log("  fetchBlocks(contract_variable) - variable name");
console.log("  fetchBlocks(is.studio) - predefined array");
