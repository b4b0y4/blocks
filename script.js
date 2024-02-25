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
      "contractData",
      JSON.stringify({ _tokenId, _hash, _script, _detail })
    )
    location.reload()
  } catch (error) {
    console.error("Error:", error)
  }
}

// Function to create and append a new script element with the desired content and type to the body
function createScriptElement(content, type = "") {
  const scriptElement = document.createElement("script")
  scriptElement.textContent = content
  if (type) {
    scriptElement.type = type
  }
  console.log("Appending script element to body:", scriptElement)
  document.body.appendChild(scriptElement)
}

// Function to update UI elements
function update(_tokenId, _hash, _script, _detail) {
  // Set the placeholder for tokenIdInput
  tokenIdInput.placeholder = _tokenId

  // Construct the content for the new script element for token data
  const tokenDataScriptContent =
    _tokenId < 3000000
      ? `let tokenData = { tokenId: "${_tokenId}", hashes: ["${_hash}"] };`
      : `let tokenData = { tokenId: "${_tokenId}", hash: "${_hash}" };`

  createScriptElement(tokenDataScriptContent)

  // Construct the content for the new script element for art code
  const artCodeScriptContent = _script

  // Determine the type for the art code script element
  const artCodeScriptType =
    _tokenId > 999999 && _tokenId < 3000000 ? "application/processing" : ""

  createScriptElement(artCodeScriptContent, artCodeScriptType)

  // If _detail exists, set detail.innerText and panel.innerText accordingly
  if (_detail) {
    detail.innerText = `${_detail[0]} / ${_detail[1]}`
    panel.innerText = _detail[2]
  }

  // Create the canvas element with opening and closing tags
  const canvas = document.createElement("canvas")
  document.body.appendChild(canvas)

  // Log the canvas element to see its structure
  console.log(canvas.outerHTML)
}

// Event listener when the DOM content is loaded
window.addEventListener("DOMContentLoaded", () => {
  // Retrieve data from local storage if available
  const storedData = JSON.parse(localStorage.getItem("contractData"))
  if (storedData) {
    update(...Object.values(storedData))
  }

  // Event listener for the Enter key press on tokenIdInput
  tokenIdInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      show()
    }
  })

  // Event listener to clear the window
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearLocalStorage()
      location.reload()
    }
  })

  // Event listener to show description
  detail.addEventListener("click", function () {
    panel.classList.toggle("open")
  })
})
