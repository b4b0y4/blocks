// This module handles the creation and injection of content into the sandboxed iframe
// where the generative artwork is rendered.

import { libs } from "./lists.js";

// Modules are injected to avoid circular dependencies.
let state, eth, dom;

export function init(stateModule, ethModule, domModule) {
  state = stateModule;
  eth = ethModule;
  dom = domModule;
}

// Rewrites unreliable IPFS gateway URLs to a more stable default.
const replaceIPFSGateways = (scriptContent) => {
  return scriptContent.replace(
    /https:\/\/(pinata\.[a-z0-9-]+\.[a-z]+|[a-z0-9-]+\.mypinata\.cloud)/g,
    "https://ipfs.io",
  );
};

// Prepares and stores the necessary data for the artwork's script in localStorage.
// This data is then read by the sandboxed iframe to render the artwork.
export function pushItemToLocalStorage(
  contract,
  tokenId,
  hash,
  script,
  extLib,
  extDep,
  ipfs,
  arweave,
) {
  // Some older contracts use unreliable IPFS gateways; this replaces them.
  if (
    (eth.nameMap[contract] === "BMFLEX" &&
      !tokenId.toString().startsWith("16")) ||
    (eth.nameMap[contract] === "HODL" && tokenId.toString().startsWith("13"))
  ) {
    script = replaceIPFSGateways(script);
  }

  const process = extLib.startsWith("processing")
    ? "application/processing"
    : "";
  const src = [libs[extLib]];

  // Handle dependencies that are also libraries.
  if (extDep.length > 0 && extDep[0].cid?.includes("@")) {
    src.push(libs[extDep[0].cid]);
  }

  let tokenIdHash = "";

  // The tokenData object is constructed differently depending on contract features.
  if (extDep.length > 0) {
    const cids = extDep
      .map((dep) => {
        if (dep.isOnchain) {
          return `{
             "cid": "${dep.cid}",
             "dependency_type": "${dep.dependency_type}",
             "data": ${JSON.stringify(dep.data)},
             "bytecode_address": "${dep.bytecode_address}"
           }`;
        }

        let cid = dep.cid;
        if (
          eth.nameMap[contract] === "BMFLEX" &&
          tokenId.toString().startsWith("16")
        ) {
          cid = replaceIPFSGateways(cid);
        }

        const dependencyType =
          cid.startsWith("Qm") ||
          cid.startsWith("baf") ||
          cid.includes("/ipfs/")
            ? "IPFS"
            : /^[a-zA-Z0-9_-]{43}$/.test(cid)
              ? "ARWEAVE"
              : "ART_BLOCKS_DEPENDENCY_REGISTRY";

        return `{
           "cid": "${cid}",
           "dependency_type": "${dependencyType}",
           "data": null
         }`;
      })
      .join(",");

    tokenIdHash = `let tokenData = {
       "tokenId": "${tokenId}",
       "externalAssetDependencies": [${cids}],
       "preferredIPFSGateway": "${ipfs || "https://ipfs.io/ipfs/"}",
       "preferredArweaveGateway": "${arweave || "https://arweave.net/"}",
       "hash": "${hash}"
     }`;
  } else if (eth.nameMap[contract] === "AB") {
    tokenIdHash = `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`;
  } else {
    tokenIdHash = `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`;
  }

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script }),
  );
}

// Injects the complete HTML and script into the iframe to render the artwork.
export async function injectFrame() {
  try {
    const {
      src = [],
      tokenIdHash,
      process,
      script,
    } = JSON.parse(localStorage.getItem("scriptData"));
    const contractData = state.getContractData();

    const styles = `
      html { height: 100%; }
      body { min-height: 100%; margin: 0; padding: 0; background-color: transparent; }
      canvas { padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0; }`;

    // Handle modern three.js which requires an importmap.
    const hasThree167 = src.some((s) => s && s.includes("three.js/0.167.0"));

    const scriptTags = hasThree167
      ? `<script type="importmap">
          {
            "imports": {
              "three":  "${src}"
            }
          }
        </script>`
      : src.map((s) => `<script src="${s}"></script>`).join("");

    const html = contractData.extLib.startsWith("custom")
      ? `<script>${tokenIdHash}</script>${script}`
      : `<!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
            ${scriptTags}
            <script>${tokenIdHash};</script>
            <style>${styles}</style>
          </head>
          <body>
            ${
              process
                ? `<script type="${process}">${script}</script><canvas></canvas>`
                : `<canvas${contractData.extLib.startsWith("babylon") ? ' id="babylon-canvas"' : ""}></canvas><script${hasThree167 ? ' type="module"' : ""}>${script}</script>`
            }
          </body>
        </html>`;

    const iframe = dom.frame.contentDocument;
    iframe.open();
    iframe.write(html);
    iframe.close();
  } catch (error) {
    console.error("injectFrame:", error);
  }
}
