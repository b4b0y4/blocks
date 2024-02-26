// Import ethers library and contract ABIs
import { ethers } from "./constants/ethers-5.6.esm.min.js"
import {
  abiV1,
  abiV2,
  abiV3,
  contractAddressV1,
  contractAddressV2,
  contractAddressV3,
} from "./constants/ab.js"

// Initialize Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("")

// Initialize contracts array
const contracts = [
  { abi: abiV1, address: contractAddressV1 },
  { abi: abiV2, address: contractAddressV2 },
  { abi: abiV3, address: contractAddressV3 },
].map(({ abi, address }) => new ethers.Contract(address, abi, provider))

// DOM elements
const tokenIdInput = document.getElementById("tokenId")
const tknData = document.getElementById("tknData")
const artCode = document.getElementById("artCode")
const detail = document.getElementById("detail")
const panel = document.querySelector(".panel")

// Variables to store contract data
let _tokenId = ""
let _hash = ""
let _script = ""
let _detail = ""

// Function to clear local storage
function clearLocalStorage() {
  localStorage.removeItem("contractData")
}

// Function to get and store data from ethereum
async function grabData() {
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
      "contractData",
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

  // Update tknData content
  const tokenData =
    _tokenId < 3000000
      ? `{ tokenId: "${_tokenId}", hashes: ["${_hash}"] };`
      : `{ tokenId: "${_tokenId}", hash: "${_hash}" };`
  tknData.innerText = `let tokenData = ${tokenData}`

  // Update artCode type and content
  if (_tokenId > 999999 && _tokenId < 3000000) {
    artCode.type = "application/processing"
  }
  artCode.textContent = _script

  // Update detail content
  if (_detail) {
    detail.innerText = `${_detail[0]} / ${_detail[1]}`
    panel.innerText = _detail[2]
  }

  // Disable p5.min.js script tag if _tokenId meets the specified condition
  if (_tokenId > 143000000 && _tokenId < 144000000) {
    document.querySelector(
      'script[src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js]'
    ).src = ""
    console.log("p5.min.js script tag disabled")
  }

  console.log("script tknData:", tknData.innerText)
  console.log("script artCode type:", artCode.type)
  console.log("script artCode:", artCode.textContent)
}

// Event listener when the DOM content is loaded
window.addEventListener("DOMContentLoaded", () => {
  // Retrieve data from local storage if available
  const storedData = JSON.parse(localStorage.getItem("contractData"))
  if (storedData) {
    update(...Object.values(storedData))
  }

  tokenIdInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      grabData()
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearLocalStorage()
      location.reload()
    }
  })

  detail.addEventListener("click", function () {
    panel.classList.toggle("open")
  })
})
