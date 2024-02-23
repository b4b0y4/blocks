import { ethers } from "./ethers-5.6.esm.min.js"
import { abiV1, contractAddressV1 } from "./abV1.js"
import { abiV2, contractAddressV2 } from "./abV2.js"
import { abiV3, contractAddressV3 } from "./abV3.js"

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth.llamarpc.com"
)
const contractV1 = new ethers.Contract(
  contractAddressV1,
  abiV1,
  provider
) /** first tokenID 0 */
const contractV2 = new ethers.Contract(
  contractAddressV2,
  abiV2,
  provider
) /** first tokenID 3000000 */
const contractV3 = new ethers.Contract(
  contractAddressV3,
  abiV3,
  provider
) /** first tokenID 374000000 */

const tokenIdInput = document.getElementById("tokenId")
const showButton = document.getElementById("showButton")

let _tokenId = ""
let _hash = ""
let _script = ""

async function show() {
  _tokenId = tokenIdInput.value
  try {
    _hash = await contractV2.tokenIdToHash(_tokenId)
    let projId = await contractV2.tokenIdToProjectId(_tokenId)
    let projectInfo = await contractV2.projectScriptInfo(projId)

    for (let i = 0; i < projectInfo[1].toNumber(); i++) {
      const scrpt = await contractV2.projectScriptByIndex(projId.toString(), i)
      _script += scrpt
    }

    console.log("token Id is:", _tokenId)
    console.log("Hash is:", _hash)
    console.log("Project ID is:", projId.toString())
    console.log("Script count is:", projectInfo[1].toNumber())
    console.log("Script is:", _script)

    update(_tokenId, _hash, _script)
  } catch (error) {
    console.error("Error:", error)
  }
}

function update(_tokenId, _hash, _script) {
  let tknData = document.getElementById("tknData")
  let artCode = document.getElementById("artCode")

  let tokenDataObj = {
    tokenId: _tokenId,
    hash: _hash,
  }
  tknData.innerText = "let tokenData = " + JSON.stringify(tokenDataObj)

  console.log("_script:", _script)
  artCode.innerText = _script

  // Execute token data script
  eval(tknData.innerText)

  // Execute art code
  eval(artCode.innerText)

  console.log(tknData.innerText)
  console.log(artCode.innerText)
}

showButton.addEventListener("click", show)
