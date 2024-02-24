// Import ethers library and contract ABIs
import { ethers } from "./constants/ethers-5.6.esm.min.js"
import { abiV1, contractAddressV1 } from "./constants/abV1.js"
import { abiV2, contractAddressV2 } from "./constants/abV2.js"
import { abiV3, contractAddressV3 } from "./constants/abV3.js"

// Initialize Ethereum provider
const provider = new ethers.providers.JsonRpcProvider(
  "https://eth.llamarpc.com"
)

// Initialize contracts array
const contracts = [
  { abi: abiV1, address: contractAddressV1 },
  { abi: abiV2, address: contractAddressV2 },
  { abi: abiV3, address: contractAddressV3 },
].map(({ abi, address }) => new ethers.Contract(address, abi, provider))

// DOM elements
const tokenIdInput = document.getElementById("tokenId")
const showButton = document.getElementById("showButton")
const tknData = document.getElementById("tknData")
const artCode = document.getElementById("artCode")
const detail = document.getElementById("detail")

// Variables to store contract data
let _tokenId = ""
let _hash = ""
let _script = ""
let _detail

// Event listener when the DOM content is loaded
window.addEventListener("DOMContentLoaded", () => {
  // Retrieve data from local storage if available
  const storedData = JSON.parse(localStorage.getItem("tokenData"))
  if (storedData) {
    ;({ _tokenId, _hash, _script, _detail } = storedData)
    update(_tokenId, _hash, _script, _detail)
  }
})

// Function to clear local storage
function clearLocalStorage() {
  localStorage.removeItem("tokenData")
}

// Function to handle show button click event
async function show() {
  _tokenId = tokenIdInput.value
  try {
    clearLocalStorage()

    // Determine contract index based on token ID
    let contractIndex = 0
    if (_tokenId >= 3000000 && _tokenId < 374000000) {
      contractIndex = 1
    } else if (_tokenId >= 374000000) {
      contractIndex = 2
    }
    const contractToUse = contracts[contractIndex]

    // Fetch contract data
    _hash = await (contractIndex === 0
      ? contractToUse.showTokenHashes(_tokenId)
      : contractToUse.tokenIdToHash(_tokenId))

    const projId = await contractToUse.tokenIdToProjectId(_tokenId)
    const projectInfo = await (contractIndex === 2
      ? contractToUse.projectScriptDetails(projId.toString())
      : contractToUse.projectScriptInfo(projId.toString()))

    // Construct script
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

    // Fetch project details
    _detail = await contractToUse.projectDetails(projId.toString())

    // Update UI
    update(_tokenId, _hash, _script, _detail)

    // Store data in local storage
    localStorage.setItem(
      "tokenData",
      JSON.stringify({ _tokenId, _hash, _script, _detail })
    )
    location.reload()
  } catch (error) {
    console.error("Error:", error)
  }
}

// Function to update UI elements
function update(_tokenId, _hash, _script, _detail) {
  tokenIdInput.placeholder = _tokenId
  tknData.innerText = `let tokenData = { tokenId: "${_tokenId}", hash: "${_hash}" }`
  artCode.textContent = _script
  if (_detail) {
    detail.innerText = `${_detail[0].toString()} / ${_detail[1].toString()}`
  }

  console.log(tknData.innerText)
  console.log(artCode.textContent)
  console.log(detail.innerText)
}

// Event listener for show button click
showButton.addEventListener("click", show)
