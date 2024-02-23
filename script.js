import { ethers } from "./constants/ethers-5.6.esm.min.js"
import { abiV1, contractAddressV1 } from "./constants/abV1.js"
import { abiV2, contractAddressV2 } from "./constants/abV2.js"
import { abiV3, contractAddressV3 } from "./constants/abV3.js"

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth.llamarpc.com"
)
const contracts = [
  { abi: abiV1, address: contractAddressV1 },
  { abi: abiV2, address: contractAddressV2 },
  { abi: abiV3, address: contractAddressV3 },
].map(({ abi, address }) => new ethers.Contract(address, abi, provider))

const tokenIdInput = document.getElementById("tokenId")
const showButton = document.getElementById("showButton")
const tknData = document.getElementById("tknData")
const artCode = document.getElementById("artCode")

let _tokenId = ""
let _hash = ""
let _script = ""

window.addEventListener("DOMContentLoaded", () => {
  const storedData = JSON.parse(localStorage.getItem("tokenData"))
  if (storedData) {
    ;({ _tokenId, _hash, _script } = storedData)
    updateTknData(_tokenId, _hash)
    updateArtCode(_script)
  }
})

function clearLocalStorage() {
  localStorage.removeItem("tokenData")
}

async function show() {
  _tokenId = tokenIdInput.value
  try {
    clearLocalStorage()

    let contractIndex = 0
    if (_tokenId >= 3000000 && _tokenId < 374000000) {
      contractIndex = 1 // v2 contract
    } else if (_tokenId >= 374000000) {
      contractIndex = 2 // v3 contract
    }

    const contractToUse = contracts[contractIndex]
    _hash = await (contractIndex === 0
      ? contractToUse.showTokenHashes(_tokenId)
      : contractToUse.tokenIdToHash(_tokenId))

    const projId = await contractToUse.tokenIdToProjectId(_tokenId)
    const projectInfo = await (contractIndex === 2
      ? contractToUse.projectScriptDetails(projId.toString())
      : contractToUse.projectScriptInfo(projId.toString()))

    _script = ""
    for (
      let i = 0;
      i <
      (contractIndex === 2
        ? projectInfo[2].toNumber()
        : projectInfo[1].toNumber());
      i++
    ) {
      const scrpt = await contractToUse.projectScriptByIndex(
        projId.toString(),
        i
      )
      _script += scrpt
    }

    updateTknData(_tokenId, _hash)
    updateArtCode(_script)

    localStorage.setItem(
      "tokenData",
      JSON.stringify({ _tokenId, _hash, _script })
    )
    location.reload()
  } catch (error) {
    console.error("Error:", error)
  }
}

function updateTknData(_tokenId, _hash) {
  tknData.innerText = `let tokenData = { tokenId: "${_tokenId}", hash: "${_hash}" }`
  console.log(tknData.innerText)
}

function updateArtCode(_script) {
  artCode.innerText = _script
  console.log(artCode.innerText)
}

showButton.addEventListener("click", show)
