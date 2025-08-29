import { instance, indexMap } from "./ethereum.js";
import { contractRegistry, is } from "./contracts.js";
import { list } from "./lists.js";

async function blocks(array) {
  for (const contractName of array) {
    const n = indexMap[contractName];
    const start = contractRegistry[contractName].startProjId || 0;
    const end = Number(await instance[n].nextProjectId());
    const newBlocks = [];
    const BATCH = 20;

    for (let id = start; id < end; id += BATCH) {
      const batchPromises = [];

      for (let batchId = id; batchId < Math.min(id + BATCH, end); batchId++) {
        batchPromises.push(
          Promise.all([
            instance[n].projectDetails(batchId.toString()),
            is.v3.includes(contractName)
              ? instance[n].projectStateData(batchId)
              : instance[n].projectTokenInfo(batchId),
          ]).catch(() => null),
        );
      }

      const results = await Promise.all(batchPromises);

      results.forEach((result, idx) => {
        if (result) {
          const [detail, token] = result;
          const newItem = `${contractName}${id + idx} # ${detail[0]} / ${detail[1]} # ${token.invocations} ${Number(token.invocations) === 1 ? "Work" : "Works"}`;

          if (!list.map((item) => item.replace(/!$/, "")).includes(newItem)) {
            newBlocks.push(`"${newItem}",`);
          }
        }
      });
    }

    if (newBlocks.length > 0) {
      console.log(`%cNew items for ${contractName}:`, "color: #4C6F6F;");
      console.log(`%c${newBlocks.join("\n")}`, "color: #FAC085");
    } else {
      console.log(`%cNo new items for ${contractName}.`, "color: #666666;");
    }
  }
}

// Expose 'is' and contract names for convenience in the console
window.is = is;
Object.keys(contractRegistry).forEach((contractName) => {
  window[contractName.toLowerCase()] = contractName;
});

window.fetchBlocks = async (contracts) => {
  let contractArray;

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

console.log("Block-fetcher module loaded.");
console.log(
  "Call fetchBlocks('CONTRACT_NAME') or fetchBlocks(contract_name_variable) from the console.",
);
console.log(
  "The 'is' object and lowercase contract name variables are available globally.",
);
