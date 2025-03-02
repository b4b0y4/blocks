import { list } from "./lists.js";
import { contractRegistry, isV2, indexMap, instance } from "./contracts.js";

async function fetchBlocks(array) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log("%cLOOKING FOR BLOCKS...", "color: crimson;");
  for (const contractName of array) {
    const n = indexMap[contractName];
    const start = contractRegistry[contractName].startProjId || 0;
    const end = Number(await instance[n].nextProjectId());
    const results = [];
    const batchSize = 5;
    for (let batchStart = start; batchStart < end; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, end);
      const batchPromises = [];
      for (let i = batchStart; i < batchEnd; i++) {
        batchPromises.push(
          (async (id) => {
            const [detail, token] = await Promise.all([
              instance[n].projectDetails(id.toString()),
              isV2.includes(contractName)
                ? instance[n].projectTokenInfo(id)
                : instance[n].projectStateData(id),
            ]);
            const newItem = `${contractName}${id} - ${detail[0]} / ${detail[1]} - ${token.invocations} ${Number(token.invocations) === 1 ? "item" : "items"}`;
            return !list.includes(newItem) ? `"${newItem}",` : null;
          })(i),
        );
      }
      results.push(...(await Promise.all(batchPromises)).filter(Boolean));
    }
    if (results.length > 0) console.log(results.join("\n"));
  }
  console.log("%cDONE!!!", "color: lime;");
}

function checkForNewContracts() {
  const existingContracts = new Set(list.map((item) => item.split(/[0-9]/)[0]));
  const newContract = Object.keys(contractRegistry).filter(
    (key) => !existingContracts.has(key),
  );
  if (newContract.length > 0) {
    fetchBlocks(newContract);
  }
}

export { fetchBlocks, checkForNewContracts };
