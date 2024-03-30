import { ethers } from "./constants/ethers.min.js"
import {
  abiV1,
  abiV2,
  abiV3,
  abiEXPLORE,
  abiABXPACE,
  abiABXPACE2,
  abiABXBM,
  abiBM,
  contractAddressV1,
  contractAddressV2,
  contractAddressV3,
  contractAddressEXPLORE,
  contractAddressABXPACE,
  contractAddressABXPACE2,
  contractAddressABXBM,
  contractAddressBM,
} from "./constants/ab.js"

// DOM elements
const rpcUrlInput = document.getElementById("rpcUrl")
const frame = document.getElementById("frame")
const infoBox = document.getElementById("infoBox")
const info = document.getElementById("info")
const overlay = document.querySelector(".overlay")
const panel = document.querySelector(".panel")
const dataPanel = document.querySelector(".data-panel")
const panelContent = document.getElementById("panelContent")
const dataContent = document.getElementById("dataContent")
const search = document.getElementById("searchInput")

// Initialize Ethereum provider
const rpcUrl = localStorage.getItem("rpcUrl")
const provider = new ethers.JsonRpcProvider(rpcUrl)

// Initialize contracts array
const contracts = [
  { abi: abiV1, address: contractAddressV1 },
  { abi: abiV2, address: contractAddressV2 },
  { abi: abiV3, address: contractAddressV3 },
  { abi: abiEXPLORE, address: contractAddressEXPLORE },
  { abi: abiABXPACE, address: contractAddressABXPACE },
  { abi: abiABXPACE2, address: contractAddressABXPACE2 },
  { abi: abiABXBM, address: contractAddressABXBM },
  { abi: abiBM, address: contractAddressBM },
].map(({ abi, address }) => new ethers.Contract(address, abi, provider))

// Libraries
const predefinedLibraries = {
  p5js: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
  p5: "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js",
  threejs: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
  three: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r124/three.min.js",
  tonejs: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
  tone: "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.15/Tone.js",
  paperjs:
    "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js",
  paper:
    "https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.15/paper-full.min.js",
  processing:
    "https://cdnjs.cloudflare.com/ajax/libs/processing.js/1.4.6/processing.min.js",
  regl: "https://cdnjs.cloudflare.com/ajax/libs/regl/2.1.0/regl.min.js",
  zdog: "https://unpkg.com/zdog@1/dist/zdog.dist.min.js",
  "a-frame":
    "https://cdnjs.cloudflare.com/ajax/libs/aframe/1.2.0/aframe.min.js",
  babylonjs:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  babylon:
    "https://cdnjs.cloudflare.com/ajax/libs/babylonjs/5.0.0/babylon.min.js",
  js: "",
  svg: "",
  custom: "",
}

// Function to clear local storage
function clearLocalStorage() {
  localStorage.removeItem("Contract")
  localStorage.removeItem("contractData")
  localStorage.removeItem("Src")
  localStorage.removeItem("IdHash")
  localStorage.removeItem("Type")
  localStorage.removeItem("Art")
}

/****************************************************
 *        FUNCTION TO GET DATA FROM ETHEREUM
 ***************************************************/
async function grabData(tokenId, contract) {
  try {
    clearLocalStorage()
    localStorage.setItem("Contract", contract)

    // Fetch contract data
    let hash = await (contract === 0
      ? contracts[contract].showTokenHashes(tokenId)
      : contracts[contract].tokenIdToHash(tokenId))

    const projId = await contracts[contract].tokenIdToProjectId(tokenId)
    const projectInfo = await (contract === 0 ||
    contract === 1 ||
    contract === 4 ||
    contract === 7
      ? contracts[contract].projectScriptInfo(projId.toString())
      : contracts[contract].projectScriptDetails(projId.toString()))

    // Construct script
    let script = ""
    for (let i = 0; i < projectInfo.scriptCount; i++) {
      const scrpt = await contracts[contract].projectScriptByIndex(
        projId.toString(),
        i
      )
      script += scrpt
    }

    // Fetch project details
    let detail = await contracts[contract].projectDetails(projId.toString())

    // Get the owner
    let owner = await contracts[contract].ownerOf(tokenId)

    // Extract library name
    let codeLib = ""
    if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
      codeLib = projectInfo[0].split("@")[0].trim()
    } else {
      codeLib = JSON.parse(projectInfo[0]).type
    }

    // Store data in local storage
    localStorage.setItem(
      "contractData",
      JSON.stringify({
        tokenId,
        hash,
        script,
        detail,
        owner,
        codeLib,
      })
    )
    location.reload()
  } catch (error) {
    console.error("Error:", error)
  }
}

/****************************************************
 *              FUNCTIONS TO UPDATE UI
 ***************************************************/
let id
function update(tokenId, hash, script, detail, owner, codeLib) {
  // Update library source
  localStorage.setItem("Src", predefinedLibraries[codeLib])

  // Update tokenIdHash content
  const tknData =
    tokenId < 3000000 && storedContract == 0
      ? `{ tokenId: "${tokenId}", hashes: ["${hash}"] }`
      : `{ tokenId: "${tokenId}", hash: "${hash}" }`

  localStorage.setItem("IdHash", `tokenData = ${tknData}`)

  // Update artCode
  let process = ""
  if (codeLib === "processing") {
    process = "application/processing"
  }
  localStorage.setItem("Type", process)
  localStorage.setItem("Art", script)

  // Update info content

  let collection
  if (storedContract == 0 || storedContract == 1 || storedContract == 2) {
    collection = "AB"
  } else if (storedContract == 3) {
    collection = "EXP"
  } else if (storedContract == 4 && tokenId < 5000000) {
    collection = "AB &times; PACE"
  } else if (storedContract == 5 && tokenId >= 5000000) {
    collection = "AB &times; PACE"
  } else if (storedContract == 6) {
    collection = "AB &times; BM"
  } else if (storedContract == 7) {
    collection = "BM"
  }

  id =
    tokenId < 1000000
      ? tokenId
      : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0
  info.innerHTML = `${detail[0]} #${id} / ${detail[1]} <span>${collection}</span>`
  search.placeholder = `${tokenId}`
  resolveENS(owner, detail)
  injectFrame()
}

// Get ENS name for owner if available
async function resolveENS(owner, detail) {
  try {
    const ensName = await provider.lookupAddress(owner)
    if (ensName) {
      panelContent.innerText = `${detail[2]}\n\n${detail[3]}\n\nOwned by: ${ensName}`
    } else {
      panelContent.innerHTML = `${detail[2]}<br><br>${detail[3]}<br><br>Owned by: <span style="font-size: 0.8em">${owner}</span>`
    }
  } catch (error) {
    console.log("Error getting ENS name:", error)
  }
}

/****************************************************
 *        FUNCTION TO INJECT INTO IFRAME
 ***************************************************/
async function injectFrame() {
  const iframeDocument = frame.contentDocument || frame.contentWindow.document
  try {
    const frameSrc = localStorage.getItem("Src")
    const frameIdHash = localStorage.getItem("IdHash")
    const frameType = localStorage.getItem("Type")
    const frameArt = localStorage.getItem("Art")
    const frameStyle = `<style type="text/css">
          html {
            height: 100%;
          }
          body {
            min-height: 100%;
            margin: 0;
            padding: 0;
            background-color: #141414;
          }
          canvas {
            padding: 0;
            margin: auto;
            display: block;
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
          }
      </style>`

    // Generate the content dynamically
    let dynamicContent
    if (storedData.codeLib === "custom") {
      dynamicContent = `<script>${frameIdHash}</script>${frameArt}`
    } else if (frameType) {
      dynamicContent = `<html>
          <head>
          <meta name='viewport' content='width=device-width, initial-scale=1', maximum-scale=1>
          <script src='${frameSrc}'></script>
          ${frameStyle}
          </head>
          <body>
          <script>${frameIdHash};</script>
          <script type='${frameType}'>${frameArt}</script>
          <canvas></canvas>
          </body>
          </html>`
    } else {
      dynamicContent = `<html>
          <head>
          <meta name='viewport' content='width=device-width, initial-scale=1', maximum-scale=1>
          <meta charset="utf-8"/>
          <script src='${frameSrc}'></script>
          <script>${frameIdHash};</script>
          ${frameStyle}
          </head>
          <body>
          <canvas id="babylon-canvas"></canvas>
          <script>${frameArt}</script>
          </body>
          </html>`
    }
    // console.log(dynamicContent)
    // Write the generated content to the iframe
    iframeDocument.open()
    iframeDocument.write(dynamicContent)
    iframeDocument.close()
  } catch (error) {
    console.error("Error:", error)
  }
}

/****************************************************
 *       FUNCTION TO SEARCH BLOCKS DATA LIST
 ***************************************************/
// Fetch data from "data.txt" and display it
fetch("data.txt")
  .then((response) => response.text())
  .then((data) => {
    const lines = data.split("\n")

    // Function to display lines
    function displayLines(lines) {
      dataContent.innerHTML = lines.join("<br>")
    }

    // Function to filter lines based on search query
    function filterLines(query) {
      const filteredLines = lines.filter((line) =>
        line.toLowerCase().includes(query.toLowerCase())
      )
      displayLines(filteredLines)
    }

    // Function to extract token ID
    function getTokenId(panelContent, searchQuery) {
      // Check if the search query is only a number
      const isNumber = /^\d+$/.test(searchQuery)
      if (isNumber) {
        let contract =
          searchQuery < 3000000 ? 0 : searchQuery < 374000000 ? 1 : 2
        grabData(searchQuery, contract)
        localStorage.setItem("Contract", contract)
        return
      }

      // Extract panel number and contract from panelContent
      const panelNumber = parseInt(panelContent.match(/\d+/)[0])
      const panelContract = panelContent.match(/^[A-Za-z0-9]+/)[0]

      // Extract search number from searchQuery
      const searchNumber = parseInt(searchQuery.match(/#\s*(\d+)/)[1])

      // Calculate tokenId
      const tokenId =
        panelNumber === 0
          ? searchNumber.toString()
          : (panelNumber * 1000000 + searchNumber).toString().padStart(6, "0")

      // Define contract based on panelContract and tokenId
      let contract
      if (panelContract === "EXP") {
        contract = 3
      } else if (panelContract === "ABXPACE") {
        contract = tokenId < 5000000 ? 4 : 5
      } else if (panelContract === "ABXBM") {
        contract = 6
      } else if (panelContract === "BM") {
        contract = 7
      } else {
        contract = tokenId < 3000000 ? 0 : tokenId < 374000000 ? 1 : 2
      }

      console.log(tokenId, contract)
      grabData(tokenId, contract)
      localStorage.setItem("Contract", contract)
    }

    // Event listener for search field
    search.addEventListener("input", (event) => {
      const query = event.target.value.trim().split("#")[0].trim()
      filterLines(query)
    })

    search.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        const query = search.value.trim()
        search.value.trim() === ""
          ? fetchAndProcessRandomLine()
          : getTokenId(dataContent.innerHTML, query)
      }
    })

    // Display all lines initially
    displayLines(lines)
  })
  .catch((error) => {
    console.error("Error reading file:", error)
  })

/****************************************************
 *                     EVENTS
 ***************************************************/
let storedData = {}
let storedContract = localStorage.getItem("Contract")
// Event listener when the DOM content is loaded
window.addEventListener("DOMContentLoaded", () => {
  storedData = JSON.parse(localStorage.getItem("contractData"))
  if (storedData) {
    update(...Object.values(storedData))
  }
  console.log("contract:", storedContract)
  // console.log("lib source:", localStorage.getItem("Src"))
  // console.log("Id an Hash:", localStorage.getItem("IdHash"))
  // console.log("code type:", localStorage.getItem("Type"))
  // console.log("Art script:", localStorage.getItem("Art"))
  console.log("library:", storedData.codeLib)
})

rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", rpcUrlInput.value)
    rpcUrlInput.style.display = "none"
    location.reload()
  }
})

window.addEventListener("load", () => {
  rpcUrl
    ? (rpcUrlInput.style.display = "none")
    : ((rpcUrlInput.style.display = "block"), (infoBox.style.display = "none"))
})

document.addEventListener("keypress", (event) => {
  if (event.key === "|") {
    clearLocalStorage()
    location.reload()
  }
})

info.addEventListener("click", () => {
  panel.classList.toggle("active")
  if (panel.classList.contains("active")) {
    dataPanel.classList.remove("active")
    overlay.style.display = "block"
  } else {
    overlay.style.display = "none"
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    event.preventDefault()
    togglePanel()
  }
})

search.addEventListener("focus", togglePanel)

function togglePanel() {
  search.focus()
  dataPanel.classList.toggle("active")
  if (dataPanel.classList.contains("active")) {
    panel.classList.remove("active")
    overlay.style.display = "block"
  } else {
    overlay.style.display = "none"
  }
}

overlay.addEventListener("click", () => {
  dataPanel.classList.remove("active")
  panel.classList.remove("active")
  overlay.style.display = "none"
})

/****************************************************
 *          FUNCTION TO SAVE THE OUTPUT
 * *************************************************/
async function saveContentAsFile(content, filename) {
  const defaultname = `${storedData.detail[0]} #${id}.html`
  const userFilename = prompt("Enter a filename:", filename || defaultname)

  if (!userFilename) {
    return
  }
  // Create a Blob containing the content
  const blob = new Blob([content], { type: "text/html" })

  // Create a temporary URL for the Blob
  const url = window.URL.createObjectURL(blob)

  // Create a temporary <a> element to trigger the download
  const link = document.createElement("a")
  link.href = url
  link.download = userFilename

  // Append the <a> element to the document body
  document.body.appendChild(link)

  // Programmatically trigger the click event
  link.click()

  // Clean up
  window.URL.revokeObjectURL(url)
  link.remove()
}

// Function to handle the button click event
function handleSaveButtonClick() {
  const dynamicContent =
    document.getElementById("frame").contentDocument.documentElement.outerHTML
  saveContentAsFile(dynamicContent)
}

// Attach the handleSaveButtonClick
document
  .getElementById("saveButton")
  .addEventListener("click", handleSaveButtonClick)

/***************************************************
 *        FUNCTIONS TO GET RANDOM TOKEN ID
 **************************************************/
// Function to process a line and extract a number
function processLine(line) {
  const regex = /^([A-Z\s]+)?(\d+).*?(\d+)\s*minted/

  const matches = line.match(regex)
  if (!matches) return null

  // Extract numbers from the regex matches
  const _contract = matches[1]
  const firstNumber = parseInt(matches[2])
  const secondNumber = parseInt(matches[3])
  // Generate a random second number
  const randomSecondNumber = Math.floor(Math.random() * (secondNumber - 1))

  const randomToken = (firstNumber * 1000000 + randomSecondNumber).toString()

  let contract
  if (_contract === "EXP ") {
    contract = 3
  } else if (_contract === "ABXPACE ") {
    contract = randomToken < 5000000 ? 4 : 5
  } else if (_contract === "ABXBM ") {
    contract = 6
  } else if (_contract === "BM ") {
    contract = 7
  } else {
    contract = randomToken < 3000000 ? 0 : randomToken < 374000000 ? 1 : 2
  }

  return [randomToken, parseInt(contract)]
}

// Function to fetch data from "data.txt", process a random line, and call grabData
async function fetchAndProcessRandomLine() {
  try {
    const response = await fetch("data.txt")
    if (!response.ok) throw new Error("Network response was not ok")

    const lines = (await response.text()).split("\n")
    const randomLine = lines[Math.floor(Math.random() * lines.length)]

    let constructedNumber = processLine(randomLine)

    if (constructedNumber) {
      console.log("Randomly selected line:", randomLine)
      console.log("Constructed Number/Contract:", constructedNumber)

      grabData(constructedNumber[0], constructedNumber[1])
    } else {
      console.log("Invalid line format.")
      throw new Error("Invalid line format")
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error)
    throw error
  }
}

document
  .getElementById("randomButton")
  .addEventListener("click", fetchAndProcessRandomLine)

/****************************************************
 *          FUNCTIONS TO GET NEXTID TOKEN
 * *************************************************/
function incrementTokenId() {
  storedData.tokenId = storedData.tokenId
    ? (parseInt(storedData.tokenId) + 1).toString()
    : "1"

  grabData(storedData.tokenId, parseInt(storedContract))
  console.log(storedData.tokenId, parseInt(storedContract))
}

function decrementTokenId() {
  storedData.tokenId = storedData.tokenId
    ? Math.max(parseInt(storedData.tokenId) - 1, 0).toString()
    : "0"

  grabData(storedData.tokenId, parseInt(storedContract))
  console.log(storedData.tokenId, parseInt(storedContract))
}

document
  .getElementById("incrementButton")
  .addEventListener("click", incrementTokenId)

document.addEventListener("keypress", (event) => {
  event.key === ">" ? incrementTokenId() : null
})

document
  .getElementById("decrementButton")
  .addEventListener("click", decrementTokenId)

document.addEventListener("keypress", (event) => {
  event.key === "<" ? decrementTokenId() : null
})

/****************************************************
 *         FUNCTION TO UPDATE ART BLOCKS LIST
 * *************************************************/
async function fetchBlocks() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    const n = i < 3 ? 0 : i < 374 ? 1 : 2
    try {
      const detail = await contracts[n].projectDetails(i.toString())
      const tkns =
        n === 2
          ? await contracts[n].projectStateData(i)
          : await contracts[n].projectTokenInfo(i)

      if (tkns.invocations) {
        All += `${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
        noToken = 0
      } else {
        console.log(`No tokens found for project ${i}`)
        noToken++
        if (noToken === 5) {
          break
        }
      }
    } catch (error) {
      console.log(`Error fetching data for project ${i}`)
      break
    }
  }
  console.log(All)
}
// fetchBlocks()

async function fetchEXPLORE() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[3].projectDetails(i.toString())
      const tkns = await contracts[3].projectStateData(i)
      if (tkns.invocations) {
        All += `EXP ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
        noToken = 0
      } else {
        console.log(`No tokens found for project ${i}`)
        noToken++
        if (noToken === 5) {
          break
        }
      }
    } catch (error) {
      console.log(`Error fetching data for project ${i}`)
      break
    }
  }
  console.log(All)
}
// fetchEXPLORE()

async function fetchABXPACE() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    const n = i < 5 ? 4 : 5
    try {
      const detail = await contracts[n].projectDetails(i.toString())
      const tkns =
        n === 4
          ? await contracts[n].projectTokenInfo(i)
          : await contracts[n].projectStateData(i)

      if (tkns.invocations) {
        All += `ABXPACE ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
        noToken = 0
      } else {
        console.log(`No tokens found for project ${i}`)
        noToken++
        if (noToken === 5) {
          break
        }
      }
    } catch (error) {
      console.log(`Error fetching data for project ${i}`)
      break
    }
  }
  console.log(All)
}
// fetchABXPACE()

async function fetchABXBM() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[6].projectDetails(i.toString())
      const tkns = await contracts[6].projectStateData(i)
      if (tkns.invocations) {
        All += `ABXBM ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
        noToken = 0
      } else {
        console.log(`No tokens found for project ${i}`)
        noToken++
        if (noToken === 5) {
          break
        }
      }
    } catch (error) {
      console.log(`Error fetching data for project ${i}`)
      break
    }
  }
  console.log(All)
}
// fetchABXBM()

async function fetchBM() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[7].projectDetails(i.toString())
      const tkns = await contracts[7].projectTokenInfo(i)
      if (tkns.invocations) {
        All += `BM ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
        noToken = 0
      } else {
        console.log(`No tokens found for project ${i}`)
        noToken++
        if (noToken === 5) {
          break
        }
      }
    } catch (error) {
      console.log(`Error fetching data for project ${i}`)
      break
    }
  }
  console.log(All)
}
// fetchBM()
