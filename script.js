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
  abiPLOTS,
  abiPLOTS2,
  abiSTBYS,
  abiATP,
  abiGRAILS,
  abiVCA,
  abiBMF,
  abiCITIZEN,
  contractAddressV1,
  contractAddressV2,
  contractAddressV3,
  contractAddressEXPLORE,
  contractAddressABXPACE,
  contractAddressABXPACE2,
  contractAddressABXBM,
  contractAddressBM,
  contractAddressPLOTS,
  contractAddressPLOTS2,
  contractAddressSTBYS,
  contractAddressATP,
  contractAddressGRAILS,
  contractAddressVCA,
  contractAddressBMF,
  contractAddressCITIZEN,
} from "./constants/ab.js"

// DOM elements
const instruction = document.querySelector(".instruction")
const rpcUrlInput = document.getElementById("rpcUrl")
const frame = document.getElementById("frame")
const infoBox = document.getElementById("infoBox")
const info = document.getElementById("info")
const overlay = document.querySelector(".overlay")
const save = document.getElementById("saveButton")
const inc = document.getElementById("incrementButton")
const dec = document.getElementById("decrementButton")
const panel = document.querySelector(".panel")
const dataPanel = document.querySelector(".data-panel")
const panelContent = document.getElementById("panelContent")
const dataContent = document.getElementById("dataContent")
const search = document.getElementById("searchInput")
const keyShort = document.querySelector(".key-short")

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
  { abi: abiPLOTS, address: contractAddressPLOTS },
  { abi: abiPLOTS2, address: contractAddressPLOTS2 },
  { abi: abiSTBYS, address: contractAddressSTBYS },
  { abi: abiATP, address: contractAddressATP },
  { abi: abiGRAILS, address: contractAddressGRAILS },
  { abi: abiVCA, address: contractAddressVCA },
  { abi: abiBMF, address: contractAddressBMF },
  { abi: abiCITIZEN, address: contractAddressCITIZEN },
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
  twemoji: "https://unpkg.com/twemoji@14.0.2/dist/twemoji.min.js",
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
    const projectInfo = await (contract === 2 ||
    contract === 3 ||
    contract === 5 ||
    contract === 6 ||
    contract === 9 ||
    contract === 10 ||
    contract === 12 ||
    contract === 14
      ? contracts[contract].projectScriptDetails(projId.toString())
      : contracts[contract].projectScriptInfo(projId.toString()))

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

  localStorage.setItem("IdHash", `let tokenData = ${tknData}`)

  // Update artCode
  let process = ""
  if (codeLib === "processing") {
    process = "application/processing"
  }
  localStorage.setItem("Type", process)
  localStorage.setItem("Art", script)

  // Update info content

  let collection =
    storedContract == 15 ||
    (storedContract == 1 && tokenId < 96000000 && tokenId >= 95000000) ||
    (storedContract == 1 && tokenId >= 189000000 && tokenId < 190000000)
      ? "citizen"
      : storedContract == 0 || storedContract == 1 || storedContract == 2
      ? "ab"
      : storedContract == 3
      ? "exp"
      : storedContract == 4 || storedContract == 5
      ? "ab &times; pace"
      : storedContract == 6
      ? "ab &times; bm"
      : storedContract == 7 || storedContract == 14
      ? "bm"
      : storedContract == 8 || storedContract == 9
      ? "plot"
      : storedContract == 10
      ? "soth's"
      : storedContract == 11
      ? "atp"
      : storedContract == 12
      ? "grail"
      : storedContract == 13
      ? "vca"
      : null

  id =
    tokenId < 1000000
      ? tokenId
      : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0
  info.innerHTML = `${detail[0]} #${id} / ${detail[1]} <span>${collection}</span>`
  resolveENS(owner, detail, tokenId)
  injectFrame()
}

// Get ENS name for owner if available
async function resolveENS(owner, detail, tokenId) {
  try {
    const ensName = await provider.lookupAddress(owner)
    if (ensName) {
      panelContent.innerHTML = `${detail[2]}<br><br ><span style="font-size: 0.85em"><a href="${detail[3]}" target="_blank">${detail[3]}</a><br><br>Owner: <a href="https://zapper.xyz/account/${owner}" target="_blank">${ensName}</a></span><br><br><span style="font-size: 0.75em">Contract: <a href="https://etherscan.io/address/${contracts[storedContract].target}" target="_blank">${contracts[storedContract].target}</a><br>Token ID: ${tokenId}</span>`
    } else {
      panelContent.innerHTML = `${detail[2]}<br><br><span style="font-size: 0.85em"><a href="${detail[3]}" target="_blank">${detail[3]}</a></span><br><br><span style="font-size: 0.75em">Owner: <a href="https://zapper.xyz/account/${owner}" target="_blank">${owner}</a><br><br>Contract: <a href="https://etherscan.io/address/${contracts[storedContract].target}" target="_blank">${contracts[storedContract].target}</a><br>Token ID: ${tokenId}</span>`
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
 *          FUNCTIONS TO SEARCH AND GET TOKEN
 ***************************************************/
// Function to display lines
function displayLines(lines) {
  dataContent.innerHTML = lines.join("<br>")
}

// Function to filter lines based on search query
function filterLines(lines, query) {
  const filteredLines = lines.filter((line) =>
    line.toLowerCase().includes(query.toLowerCase())
  )
  displayLines(filteredLines)
}

// Function to extract token ID and contract
function getToken(panelContent, searchQuery) {
  if (searchQuery.includes(",")) {
    const [query, query2] = searchQuery
      .split(",")
      .map((str) => str.trim().toUpperCase())
    let contract
    switch (query2) {
      case "EXP":
        contract = 3
        break
      case "ABXPACE":
        contract = query < 5000000 ? 4 : 5
        break
      case "ABXBM":
        contract = 6
        break
      case "BM":
        contract = query < 1000000 ? 14 : 7
        break
      case "PLOT":
        contract = 8
        break
      case "PLOTII":
        contract = 9
        break
      case "STBYS":
        contract = 10
        break
      case "ATP":
        contract = 11
        break
      case "GRAIL":
        contract = 12
        break
      case "VCA":
        contract = 13
        break
      case "CITIZEN":
        contract = 15
        break
      default:
        contract = query < 3000000 ? 0 : query < 374000000 ? 1 : 2
    }

    console.log("tokenId, contract:", query, contract)
    grabData(query, contract)
    localStorage.setItem("Contract", contract)
  } else if (/^\d+$/.test(searchQuery)) {
    let contract = searchQuery < 3000000 ? 0 : searchQuery < 374000000 ? 1 : 2

    console.log("tokenId, contract:", searchQuery, contract)
    grabData(searchQuery, contract)
    localStorage.setItem("Contract", contract)
  } else {
    const projId = parseInt(panelContent.match(/\d+/)[0])
    const listContract = panelContent.match(/^[A-Za-z0-9]+/)[0]
    const searchId = parseInt(searchQuery.match(/#\s*(\d+)/)[1])
    const tokenId =
      projId === 0
        ? searchId.toString()
        : (projId * 1000000 + searchId).toString().padStart(6, "0")
    let contract
    switch (listContract) {
      case "EXP":
        contract = 3
        break
      case "ABXPACE":
        contract = tokenId < 5000000 ? 4 : 5
        break
      case "ABXBM":
        contract = 6
        break
      case "BM":
        contract = tokenId < 1000000 ? 14 : 7
        break
      case "PLOT":
        contract = 8
        break
      case "PLOTII":
        contract = 9
        break
      case "STBYS":
        contract = 10
        break
      case "ATP":
        contract = 11
        break
      case "GRAIL":
        contract = 12
        break
      case "VCA":
        contract = 13
        break
      case "CITIZEN":
        contract = 15
        break
      default:
        contract = tokenId < 3000000 ? 0 : tokenId < 374000000 ? 1 : 2
    }
    console.log("Contract:", contract)
    console.log("Token Id:", tokenId)
    grabData(tokenId, contract)
    localStorage.setItem("Contract", contract)
  }
}

// Fetching data
fetch("data.txt")
  .then((response) => response.text())
  .then((data) => {
    const lines = data.split("\n")
    // Display all lines initially
    displayLines(lines)

    // Event listener for search field
    search.addEventListener("input", (event) => {
      const query = event.target.value.trim().split("#")[0].trim()
      filterLines(lines, query)
    })

    search.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        const query = search.value.trim()
        query === ""
          ? fetchAndProcessRandomLine()
          : getToken(dataContent.innerHTML, query)
      }
    })
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

  storedData
    ? ((inc.style.display = "block"),
      (dec.style.display = "block"),
      (save.style.display = "block"))
    : ((inc.style.display = "none"),
      (dec.style.display = "none"),
      (save.style.display = "none"))

  // console.log("contract:", storedContract)
  // console.log("lib source:", localStorage.getItem("Src"))
  // console.log("Id an Hash:", localStorage.getItem("IdHash"))
  // console.log("code type:", localStorage.getItem("Type"))
  // console.log("Art script:", localStorage.getItem("Art"))
  // console.log("library:", storedData.codeLib)
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
    ? ((rpcUrlInput.style.display = "none"),
      (instruction.style.display = "none"))
    : ((rpcUrlInput.style.display = "block"),
      (instruction.style.display = "block"),
      (infoBox.style.display = "none"))
})

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
    clearLocalStorage()
    location.reload()
  }
})

info.addEventListener("click", () => {
  panel.classList.toggle("active")
  if (panel.classList.contains("active")) {
    dataPanel.classList.remove("active")
    overlay.style.display = "block"
    keyShort.style.display = "block"
  } else {
    overlay.style.display = "none"
  }
})

document.querySelector(".search-icon").addEventListener("click", () => {
  dataPanel.classList.toggle("active")
  if (dataPanel.classList.contains("active")) {
    panel.classList.remove("active")
    overlay.style.display = "block"
  } else {
    overlay.style.display = "none"
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault()
    search.focus()
    dataPanel.classList.toggle("active")
    if (dataPanel.classList.contains("active")) {
      panel.classList.remove("active")
      overlay.style.display = "block"
      keyShort.style.display = "none"
    } else {
      overlay.style.display = "none"
      keyShort.style.display = "block"
    }
  }
})

search.addEventListener("input", () => {
  if (search.value.trim() !== "") {
    dataPanel.classList.add("active")
    panel.classList.remove("active")
    overlay.style.display = "block"
    keyShort.style.display = "none"
  } else {
    dataPanel.classList.remove("active")
    overlay.style.display = "none"
    keyShort.style.display = "block"
  }
})

overlay.addEventListener("click", () => {
  dataPanel.classList.remove("active")
  panel.classList.remove("active")
  overlay.style.display = "none"
})

/****************************************************
 *          FUNCTION TO SAVE THE OUTPUT
 * *************************************************/
async function saveContentAsFile(content, filename) {
  const defaultName = `${storedData.detail[0].replace(/\s+/g, "-")}#${id}.html`

  let userFilename = filename || defaultName

  userFilename = prompt("Enter a filename:", userFilename)

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
save.addEventListener("click", handleSaveButtonClick)

/***************************************************
 *        FUNCTIONS TO GET RANDOM TOKEN ID
 **************************************************/
// Function to process a line and extract a number
function processLine(line) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*minted/

  const matches = line.match(regex)
  if (!matches) return null

  const id = parseInt(matches[3])
  const randomToken = `#${Math.floor(Math.random() * (id - 1))}`

  console.log("Random token:", randomToken)
  getToken(line, randomToken)
}

// Function to fetch data from "data.txt", process a random line, and call grabData
async function fetchAndProcessRandomLine() {
  try {
    const response = await fetch("data.txt")
    if (!response.ok) throw new Error("Network response was not ok")

    const lines = (await response.text()).split("\n")
    const randomLine = lines[Math.floor(Math.random() * lines.length)]

    console.log("Randomly selected line:", randomLine)
    processLine(randomLine)
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error)
    throw error
  }
}

document
  .getElementById("randomButton")
  .addEventListener("click", fetchAndProcessRandomLine)

/****************************************************
 *      FUNCTIONS TO GET PREVIOUS/NEXT ID TOKEN
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

inc.addEventListener("click", incrementTokenId)

document.addEventListener("keypress", (event) => {
  event.key === ">" ? incrementTokenId() : null
})

dec.addEventListener("click", decrementTokenId)

document.addEventListener("keypress", (event) => {
  event.key === "<" ? decrementTokenId() : null
})

/****************************************************
 *         FUNCTION TO UPDATE ART BLOCKS LIST
 * *************************************************/
async function fetchBlocks() {
  let All = ""
  let noToken = 0
  for (let i = 223; i < 1000; i++) {
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

async function fetchEXP() {
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
// fetchEXP()

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
  for (let i = 0; i < 100; i++) {
    const n = i < 1 ? 14 : 7
    try {
      const detail = await contracts[n].projectDetails(i.toString())
      const tkns =
        n === 14
          ? await contracts[n].projectStateData(i)
          : await contracts[n].projectTokenInfo(i)

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

async function fetchCITIZEN() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[15].projectDetails(i.toString())
      const tkns = await contracts[15].projectTokenInfo(i)
      if (tkns.invocations) {
        All += `CITIZEN ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchCITIZEN()

async function fetchPLOT() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[8].projectDetails(i.toString())
      const tkns = await contracts[8].projectTokenInfo(i)
      if (tkns.invocations) {
        All += `PLOT ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchPLOT()

async function fetchPLOT2() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[9].projectDetails(i.toString())
      const tkns = await contracts[9].projectStateData(i)
      if (tkns.invocations) {
        All += `PLOTII ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchPLOT2()

async function fetchSTBYS() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[10].projectDetails(i.toString())
      const tkns = await contracts[10].projectStateData(i)
      if (tkns.invocations) {
        All += `STBYS ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchSTBYS()

async function fetchATP() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[11].projectDetails(i.toString())
      const tkns = await contracts[11].projectTokenInfo(i)
      if (tkns.invocations) {
        All += `ATP ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchATP()

async function fetchGRAILS() {
  let All = ""
  let noToken = 0
  for (let i = 1; i < 1000; i++) {
    try {
      const detail = await contracts[12].projectDetails(i.toString())
      const tkns = await contracts[12].projectStateData(i)
      if (tkns.invocations) {
        All += `GRAIL ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchGRAILS()

async function fetchVCA() {
  let All = ""
  let noToken = 0
  for (let i = 0; i < 1000; i++) {
    try {
      const detail = await contracts[13].projectDetails(i.toString())
      const tkns = await contracts[13].projectTokenInfo(i)
      if (tkns.invocations) {
        All += `VCA ${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted\n`
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
// fetchVCA()
