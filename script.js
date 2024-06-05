import { ethers } from "./ethers.min.js"
import { isV2, contractsData } from "./contracts.js"
import { libs, list } from "./lists.js"

const loopInput = document.getElementById("loopInput")
const instruction = document.querySelector(".instruction")
const rpcUrlInput = document.getElementById("rpcUrl")
const frame = document.getElementById("frame")
const infobar = document.querySelector(".infobar")
const info = document.getElementById("info")
const save = document.getElementById("saveBtn")
const dec = document.getElementById("decrementBtn")
const inc = document.getElementById("incrementBtn")
const overlay = document.querySelector(".overlay")
const panel = document.querySelector(".panel")
const listPanel = document.querySelector(".list-panel")
const favPanel = document.querySelector(".fav-panel")
const search = document.getElementById("searchInput")

const rpcUrl = localStorage.getItem("rpcUrl")
const provider = new ethers.JsonRpcProvider(rpcUrl)

const contracts = []
const contractNameMap = {}
const contractIndexMap = {}

Object.keys(contractsData).forEach((key, index) => {
  const { abi, address } = contractsData[key]
  contracts.push(new ethers.Contract(address, abi, provider))
  contractNameMap[index] = key
  contractIndexMap[key] = index
})

/***************************************************
 *        FUNCTIONS TO GET DATA FROM ETHEREUM
 **************************************************/
let contractData = {}

async function grabData(tokenId, contract) {
  try {
    toggleSpin()
    clearPanels()
    clearDataStorage()
    console.log("Contract:", contract, "\nToken Id:", tokenId)

    const isContractV2 = isV2.includes(contractNameMap[contract])
    const hash = await fetchHash(tokenId, contract)
    const projId = Number(await fetchProjectId(tokenId, contract))
    const projectInfo = await fetchProjectInfo(projId, contract, isContractV2)
    const script = await constructScript(projId, projectInfo, contract)
    const detail = await fetchProjectDetails(projId, contract)
    const { owner, ensName } = await fetchOwner(tokenId, contract)
    const extLib = extractLibraryName(projectInfo)
    const { edition, remaining } = await fetchEditionInfo(
      projId,
      contract,
      isContractV2
    )

    localStorage.setItem(
      "contractData",
      JSON.stringify({
        tokenId,
        contract,
        projId,
        hash,
        script,
        detail,
        owner,
        ensName,
        extLib,
        edition,
        remaining,
      })
    )
    location.reload()
  } catch (error) {
    console.error("grabData:", error)
    search.placeholder = "error"
  }
}

async function fetchHash(tokenId, contract) {
  return contract == 0
    ? contracts[contract].showTokenHashes(tokenId)
    : contracts[contract].tokenIdToHash(tokenId)
}

async function fetchProjectId(tokenId, contract) {
  return contracts[contract].tokenIdToProjectId(tokenId)
}

async function fetchProjectInfo(projId, contract, isContractV2) {
  return isContractV2
    ? contracts[contract].projectScriptInfo(projId)
    : contracts[contract].projectScriptDetails(projId)
}

async function constructScript(projId, projectInfo, contract) {
  let script = ""
  for (let i = 0; i < projectInfo.scriptCount; i++) {
    const scrpt = await contracts[contract].projectScriptByIndex(projId, i)
    script += scrpt
  }
  return script
}

async function fetchProjectDetails(projId, contract) {
  return contracts[contract].projectDetails(projId)
}

async function fetchOwner(tokenId, contract) {
  const owner = await contracts[contract].ownerOf(tokenId)
  const ensName = await provider.lookupAddress(owner)
  return { owner, ensName }
}

function extractLibraryName(projectInfo) {
  if (typeof projectInfo[0] === "string" && projectInfo[0].includes("@")) {
    return projectInfo[0].trim()
  } else {
    return JSON.parse(projectInfo[0]).type
  }
}

async function fetchEditionInfo(projId, contract, isContractV2) {
  const invo = await (isContractV2
    ? contracts[contract].projectTokenInfo(projId)
    : contracts[contract].projectStateData(projId))

  return {
    edition: invo.maxInvocations.toString(),
    remaining: (invo.maxInvocations - invo.invocations).toString(),
  }
}

/***************************************************
 *              FUNCTIONS TO UPDATE UI
 **************************************************/
function update(
  tokenId,
  contract,
  projId,
  hash,
  script,
  detail,
  owner,
  ensName,
  extLib,
  edition,
  remaining
) {
  pushItemToLocalStorage(contract, tokenId, hash, script, extLib)
  const curation = [0, 1, 2].includes(contract)
    ? determineCuration(projId)
    : null
  const platform = getPlatform(contract, curation)

  updateInfo(
    contract,
    owner,
    ensName,
    detail,
    tokenId,
    platform,
    edition,
    remaining
  )
  injectFrame()
}

function pushItemToLocalStorage(contract, tokenId, hash, script, extLib) {
  const src = libs[extLib]
  const tokenIdHash =
    tokenId < 3000000 && contract == 0
      ? `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`
      : `let tokenData = { tokenId: "${tokenId}", hash: "${hash}" }`
  let process = extLib == "processing" ? "application/processing" : ""

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script })
  )
}

function determineCuration(projId) {
  const curated = [
    0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 17, 21, 23, 27, 28, 29, 35, 39, 40,
    41, 53, 59, 62, 64, 72, 74, 78, 89, 100, 114, 120, 129, 131, 138, 143, 147,
    159, 173, 204, 206, 209, 214, 215, 225, 232, 233, 250, 255, 261, 267, 282,
    284, 296, 304, 309, 320, 328, 333, 334, 336, 337, 341, 364, 367, 368, 376,
    379, 383, 385, 399, 406, 407, 412, 416, 417, 418, 423, 426, 428, 433, 455,
    456, 457, 462, 466, 471, 472, 482, 483, 484, 486, 487, 488, 493,
  ]
  const playground = [
    6, 14, 15, 16, 18, 19, 20, 22, 24, 25, 26, 30, 37, 42, 48, 56, 57, 68, 77,
    94, 104, 108, 112, 119, 121, 130, 134, 137, 139, 145, 146, 157, 163, 164,
    167, 191, 197, 200, 201, 208, 212, 217, 228, 230, 234, 248, 256, 260, 264,
    286, 289, 292, 294, 310, 319, 329, 339, 340, 350, 356, 362, 366, 369, 370,
    373,
  ]
  return curated.includes(projId)
    ? "Art Blocks Curated"
    : playground.includes(projId)
    ? "Art Blocks Playground"
    : projId < 374
    ? "Art Blocks Factory"
    : projId < 494
    ? "Art Blocks Presents"
    : "Art Blocks"
}

const getPlatform = (contract, curation) => {
  const contractName = contractNameMap[contract]
  const platform = {
    EXP: "Art Blocks Explorations",
    ABXBM: "Art Blocks &times; Bright Moments",
    STBYS: "Sotheby's",
    ATP: "ATP",
    GRAIL: "Grailers",
    AOI: "AOI",
    VCA: "Vertical Crypto Art",
    SDAO: "SquiggleDAO",
    MINTS: "Endaoment",
    TDG: "The Disruptive Gallery",
    VFA: "Vertu Fine Art",
    UNITLDN: "Unit London",
    TRAME: "Trame",
    HODL: "Hodlers",
    FAB: "Foundation for Art and Blockchain",
    FLUTTER: "FlamingoDAO",
    TENDER: "Tender",
    CDESK: "Coindesk",
    ARTCODE: "Redlion",
    TBOA: "TBOA Club",
    LOM: "Legends of Metaterra",
  }

  ;[
    [["AB", "ABII", "ABIII"], curation],
    [["ABXPACE", "ABXPACEII"], "Art Blocks &times; Pace"],
    [["BM", "BMF", "CITIZEN"], "Bright Moments"],
    [["PLOT", "PLOTII"], "Plottables"],
    [["ABS", "ABSI", "ABSII", "ABSIII", "ABSIV"], "Art Blocks Studio"],
  ].forEach(([keys, value]) => keys.forEach((key) => (platform[key] = value)))

  return platform[contractName] || null
}

function updateInfo(
  contract,
  owner,
  ensName,
  detail,
  tokenId,
  platform,
  edition,
  remaining
) {
  let artist = detail[1]
  const logs = []
  const originalLog = frame.contentWindow.console.log
  frame.contentWindow.console.log = function (message) {
    const contractName = contractNameMap[contract]
    if (contractName == "BMF" && logs.length === 0) {
      message = message.replace(/Artist\s*\d+\.\s*/, "").replace(/\s*--.*/, "")
      logs.push(message)
      artist = logs[0]
      updateInfo()
    }
    originalLog.apply(console, arguments)
  }

  const mintedOut =
    remaining == 0
      ? `Edition of ${edition} works.`
      : `Edition of ${edition} works, ${remaining} remaining.`

  const updateInfo = () => {
    info.innerHTML = `${detail[0]} #${shortId(tokenId)} / ${artist}`
    document.getElementById("panelContent").innerHTML = `
      <p>
        <span style="font-size: 1.4em">${detail[0]}</span><br>
        ${artist} ● ${platform}<br>
        ${mintedOut}
      </p><br>
      <p>
        ${detail[2]} <a href="${detail[3]}" target="_blank">${detail[3]}</a>
      </p><br>
      <p>
        Owner <a href="https://zapper.xyz/account/${owner}" target="_blank">${
      ensName || shortAddr(owner)
    }</a><span class="copy-text" data-text="${owner}"><i class="fa-regular fa-copy"></i></span><br>
        Contract <a href="https://etherscan.io/address/${
          contracts[contract].target
        }" target="_blank">${shortAddr(
      contracts[contract].target
    )}</a><span class="copy-text" data-text="${
      contracts[contract].target
    }"><i class="fa-regular fa-copy"></i></span><br>
        Token Id <span class="copy-text" data-text="${tokenId}">${tokenId}<i class="fa-regular fa-copy"></i></span>
      </p>
    `
    document
      .querySelectorAll(".copy-text")
      .forEach((element) =>
        element.addEventListener("click", () =>
          copyToClipboard(element.getAttribute("data-text"))
        )
      )
  }
  updateInfo()
}

function shortId(tokenId) {
  return tokenId < 1000000
    ? tokenId
    : parseInt(tokenId.toString().slice(-6).replace(/^0+/, "")) || 0
}

function shortAddr(address) {
  return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`
}

/***************************************************
 *        FUNCTION TO INJECT INTO IFRAME
 **************************************************/
async function injectFrame() {
  const iframeDocument = frame.contentDocument || frame.contentWindow.document
  try {
    let scriptData = JSON.parse(localStorage.getItem("scriptData"))

    const frameBody = scriptData.process
      ? `<body>
    <script type='${scriptData.process}'>${scriptData.script}</script>
    <canvas></canvas>
    </body>`
      : `<body>
    <canvas id="babylon-canvas"></canvas>
    <script>${scriptData.script}</script>
    </body>`

    let dynamicContent
    if (contractData.extLib === "custom") {
      dynamicContent = `<script>${scriptData.tokenIdHash}</script>${scriptData.script}`
    } else {
      dynamicContent = `<html><head>
      <meta name='viewport' content='width=device-width, initial-scale=1', maximum-scale=1>
      <script src='${scriptData.src || ""}'></script>
      <script>${scriptData.tokenIdHash};</script>
      <style type="text/css">
        html {
          height: 100%;
        }
        body {
          min-height: 100%;
          margin: 0;
          padding: 0;
          background-color: transparent;
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
      </style>
      </head>
      ${frameBody}</html>`
    }

    iframeDocument.open()
    iframeDocument.write(dynamicContent)
    iframeDocument.close()
  } catch (error) {
    console.error("injectFrame:", error)
  }
}

/***************************************************
 *            FUNCTIONS TO GET TOKEN
 **************************************************/
function getToken(line, searchQuery) {
  if (/^\d+$/.test(searchQuery)) {
    handleNumericQuery(searchQuery)
  } else {
    handleOtherQuery(line, searchQuery)
  }
}

function handleNumericQuery(searchQuery) {
  const { contract, projId } = contractData
  const id = parseInt(searchQuery.match(/\s*(\d+)/)[1])
  const tokenId =
    projId == 0
      ? id
      : Number((projId * 1000000 + id).toString().padStart(6, "0"))

  grabData(tokenId, contract)
}

function handleOtherQuery(line, searchQuery) {
  const regex = /^([A-Z]+)?\s?([0-9]+).*?([0-9]+)\s*minted/
  const [_, listContract, projIdStr, tokenStr] = line.match(regex)
  const projId = parseInt(projIdStr)
  const token = parseInt(tokenStr)
  const contract = contractIndexMap[listContract]
  let tokenId

  if (searchQuery.includes("#")) {
    const searchId = parseInt(searchQuery.match(/#\s*(\d+)/)[1])
    tokenId =
      projId === 0
        ? searchId
        : Number((projId * 1000000 + searchId).toString().padStart(6, "0"))
  } else {
    const randomToken = Math.floor(Math.random() * token)
    tokenId =
      projId === 0
        ? randomToken
        : Number((projId * 1000000 + randomToken).toString().padStart(6, "0"))
  }

  grabData(tokenId, contract)
}

/***************************************************
 *          FUNCTIONS TO DISPLAY LIST
 **************************************************/
let filteredList = list
let selectedIndex = -1

function displayList(lines) {
  const panel = lines
    .map((line, index) => {
      const parts = line.split(" - ")
      const displayText = parts.slice(1, parts.length - 1).join(" - ")
      const mintedInfo = parts[parts.length - 1].replace("minted", "items")
      return `<p class="list-item" data-index="${index}">${displayText}<span>${mintedInfo}</span></p>`
    })
    .join("")
  listPanel.innerHTML = `<div>${panel}</div>`
}

function filterList(lines, query) {
  filteredList = lines.filter((line) =>
    line.toLowerCase().includes(query.toLowerCase())
  )
  displayList(filteredList)
  selectedIndex = -1
}

function handleItemClick(event) {
  const listItem = event.target.closest(".list-item")
  if (listItem) {
    const selectedIndex = listItem.getAttribute("data-index")
    console.log("Item clicked:", filteredList[selectedIndex])
    getToken(filteredList[selectedIndex], "")
    search.value = ""
  }
}

function handleKeyboardNavigation(event) {
  if (event.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % filteredList.length
  } else if (event.key === "ArrowUp") {
    if (selectedIndex === -1) {
      selectedIndex = filteredList.length - 1
    } else {
      selectedIndex =
        (selectedIndex - 1 + filteredList.length) % filteredList.length
    }
  } else if (event.key === "Enter") {
    if (selectedIndex !== -1) {
      console.log("Item clicked:", filteredList[selectedIndex])
      getToken(filteredList[selectedIndex], "")
    } else {
      const query = search.value.trim()
      query === "" ? getRandom(list) : getToken(filteredList.join("\n"), query)
    }
    search.value = ""
  }

  const items = document.querySelectorAll(".list-item")
  items.forEach((item, index) => {
    item.classList.toggle("selected", index === selectedIndex)
  })

  if (selectedIndex !== -1)
    items[selectedIndex].scrollIntoView({ block: "nearest" })
}
displayList(list)

search.addEventListener("input", (event) => {
  const query = event.target.value.trim().split("#")[0].trim()
  filterList(list, query)
})

search.addEventListener("keydown", handleKeyboardNavigation)

listPanel.addEventListener("click", handleItemClick)

/***************************************************
 *              RANDOMNESS FUNCTIONS
 **************************************************/
function getRandom(lines) {
  const randomLine = lines[Math.floor(Math.random() * lines.length)]
  console.log("Randomly selected line:", randomLine)
  getToken(randomLine, "")
}

function getRandomKey(favorite) {
  const keys = Object.keys(favorite)

  if (keys.length > 0) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)]

    clearDataStorage()

    contractData = favorite[randomKey]
    localStorage.setItem("contractData", JSON.stringify(contractData))
    location.reload()
  }
}

document.getElementById("randomButton").addEventListener("click", () => {
  getRandom(list)
})

/***************************************************
 *                  LOOP FUNCTIONS
 **************************************************/
let intervalId
const MIN_TO_MS = 60000
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: MIN_TO_MS,
  action: null,
}

function loopRandom(interval, action) {
  clearInterval(intervalId)
  const favorite = JSON.parse(localStorage.getItem("favorite")) || "{}"

  if (loopState.isLooping !== "true") performAction(action, list, favorite)

  intervalId = setInterval(() => {
    performAction(action, list, favorite)
  }, interval)

  loopState = { isLooping: "true", interval, action }
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function performAction(action, list, favorite) {
  if (action === "loop") getRandom(list)
  else if (action === "favLoop") getRandomKey(favorite)
}

function stopRandomLoop() {
  clearInterval(intervalId)
  loopState.isLooping = "false"
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function checkLocalStorage() {
  loopInput.placeholder = `${loopState.interval / MIN_TO_MS}min`

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action)
}

function handleLoopClick(action) {
  let inputValue = loopInput.value.trim()
  const inputVal = parseInt(inputValue, 10)

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * MIN_TO_MS)
      ? loopState.interval
      : inputVal * MIN_TO_MS

  if (!isNaN(interval) && interval > 0) {
    if (loopState.isLooping !== "true") {
      loopRandom(interval, action)
      toggleInfobarVisibility()
    } else {
      stopRandomLoop()
      toggleInfobarVisibility()
    }
  } else {
    alert("Please enter a time in minutes.")
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    loopState = { isLooping: "false", interval: interval, action: action }
    localStorage.setItem("loopState", JSON.stringify(loopState))
  }
}

document
  .getElementById("loop")
  .addEventListener("click", () => handleLoopClick("loop"))
document
  .getElementById("favLoop")
  .addEventListener("click", () => handleLoopClick("favLoop"))

/***************************************************
 *          FUNCTION TO SAVE THE OUTPUT
 **************************************************/
async function saveOutput() {
  clearPanels()
  const content = frame.contentDocument.documentElement.outerHTML
  let id = getShortenedId(contractData.tokenId)
  const defaultName = `${contractData.detail[0].replace(
    /\s+/g,
    "-"
  )}#${id}.html`
  const blob = new Blob([content], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = defaultName
  document.body.appendChild(link)
  link.click()

  URL.revokeObjectURL(url)
  link.remove()
  pushContractDataToStorage(id)
}

save.addEventListener("click", saveOutput)

/***************************************************
 * FUNCTIONS TO MANIPULATE SAVED OUTPUT IN STORAGE
 **************************************************/
let favorite = JSON.parse(localStorage.getItem("favorite")) || {}

function pushContractDataToStorage(id) {
  const key = `${contractData.detail[0]} #${id} by ${contractData.detail[1]}`
  favorite[key] = contractData
  localStorage.setItem("favorite", JSON.stringify(favorite))
}

function deleteContractDataFromStorage(key) {
  if (favorite.hasOwnProperty(key)) delete favorite[key]
  localStorage.setItem("favorite", JSON.stringify(favorite))
}

function displayFavorite(key) {
  clearDataStorage()
  contractData = favorite[key]
  localStorage.setItem("contractData", JSON.stringify(contractData))
  location.reload()
}

function displayFavoriteList() {
  favPanel.innerHTML = ""

  for (let key in favorite) {
    if (favorite.hasOwnProperty(key)) {
      const keyElement = document.createElement("p")
      keyElement.textContent = key
      const delSpan = document.createElement("span")
      delSpan.innerHTML = `<i class="fa-solid fa-xmark"></i>`

      delSpan.addEventListener("click", (event) => {
        event.stopPropagation()
        deleteContractDataFromStorage(key)
        displayFavoriteList()
      })

      keyElement.addEventListener("click", () => {
        toggleSpin()
        displayFavorite(key)
        clearPanels()
      })

      keyElement.appendChild(delSpan)
      favPanel.appendChild(keyElement)
    }
  }
}

/***************************************************
 *      FUNCTIONS TO GET PREVIOUS/NEXT ID TOKEN
 **************************************************/
function incrementTokenId() {
  contractData.tokenId = contractData.tokenId + 1
  grabData(contractData.tokenId, contractData.contract)
}

function decrementTokenId() {
  contractData.tokenId = contractData.tokenId - 1
  grabData(contractData.tokenId, contractData.contract)
}

inc.addEventListener("click", incrementTokenId)
dec.addEventListener("click", decrementTokenId)

/***************************************************
 *              HELPER FUNCTIONS
 **************************************************/
function clearDataStorage() {
  ;["contractData", "scriptData"].forEach((d) => localStorage.removeItem(d))
}

function clearPanels() {
  ;[listPanel, panel, favPanel].forEach((p) => p.classList.remove("active"))
  overlay.style.display = "none"
}

function toggleSpin() {
  document.querySelector(".spinner").style.display = "block"
  document.querySelector(".key-short").style.display = "none"
}

function togglePanel(panelElement) {
  ;[panel, listPanel, favPanel].forEach(
    (p) => p !== panelElement && p.classList.remove("active")
  )
  const isActive = panelElement.classList.toggle("active")
  overlay.style.display = isActive ? "block" : "none"
}

function toggleKeyShort(event) {
  document.querySelector(".key-short").style.display =
    event.type === "focusin" ? "none" : "block"
}

function setupInfobar() {
  const isInfobarInactive = localStorage.getItem("infobarInactive") === "true"
  infobar.classList.toggle("inactive", isInfobarInactive)
}

function toggleInfobarVisibility() {
  const isInfobarInactive = infobar.classList.toggle("inactive")
  localStorage.setItem("infobarInactive", isInfobarInactive)
  if (loopState.isLooping !== "true") location.reload()
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => console.log("Copied:", text))
    .catch((error) => console.error("Failed to copy:", error))
}

/***************************************************
 *                     EVENTS
 **************************************************/
document.addEventListener("DOMContentLoaded", () => {
  setupInfobar()
  checkLocalStorage()

  contractData = JSON.parse(localStorage.getItem("contractData"))
  if (contractData) update(...Object.values(contractData))

  const value = contractData ? "block" : "none"
  ;[inc, dec, save].forEach((el) => (el.style.display = value))

  const val = rpcUrl ? "none" : "block"
  ;[rpcUrlInput, instruction].forEach((el) => (el.style.display = val))

  if (!rpcUrl) document.getElementById("infoBox").style.display = "none"
  console.log(contractData.extLib)
})

rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", rpcUrlInput.value)
    location.reload()
  }
})

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "c") {
    clearDataStorage()
    location.reload()
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "/") {
    event.preventDefault()
    search.focus()
    togglePanel(listPanel)
  }
})

info.addEventListener("click", () => {
  togglePanel(panel)
})

document.querySelector(".search-icon").addEventListener("click", () => {
  togglePanel(listPanel)
})

document.getElementById("favList").addEventListener("click", () => {
  displayFavoriteList()
  togglePanel(favPanel)
})

search.addEventListener("input", () => {
  if (search.value.trim() !== "") {
    listPanel.classList.add("active")
    panel.classList.remove("active")
    favPanel.classList.remove("active")
    overlay.style.display = "block"
  }
})

search.addEventListener("focusin", toggleKeyShort)
search.addEventListener("focusout", toggleKeyShort)

toggleBox.addEventListener("click", toggleInfobarVisibility)

overlay.addEventListener("click", () => {
  clearPanels()
})

/***************************************************
 *              DARK/LIGHT MODE TOGGLE
 **************************************************/
const root = document.documentElement
const isDarkMode = JSON.parse(localStorage.getItem("darkMode"))

if (isDarkMode) root.classList.toggle("dark-mode")
root.classList.remove("no-flash")

document.getElementById("modeToggle").addEventListener("click", () => {
  root.classList.toggle("dark-mode")
  const updateMode = root.classList.contains("dark-mode")
  localStorage.setItem("darkMode", updateMode)
})

/***************************************************
 *         FUNCTIONS TO UPDATE THE LIST
 **************************************************/
const contractNames = ["AOI"]
// fetchBlocks(contractNames)

async function fetchBlocks(contractNames) {
  for (const contractName of contractNames) {
    const n = contractIndexMap[contractName]

    let token
    let newList = ""
    const isContractV2 = isV2.includes(contractName)

    const iStart =
      contractName === "ABII"
        ? 3
        : contractName === "ABIII"
        ? 374
        : contractName === "ABXPACEII"
        ? 5
        : ["GRAIL", "HODL"].includes(contractName)
        ? 1
        : 0

    for (let i = iStart; i < 500; i++) {
      try {
        const detail = await contracts[n].projectDetails(i.toString())
        const tkns = isContractV2
          ? await contracts[n].projectTokenInfo(i)
          : await contracts[n].projectStateData(i)

        if (tkns.invocations) {
          newList += `'${contractName}${i} - ${detail[0]} / ${detail[1]} - ${tkns.invocations} minted', `
          token = 0
        } else {
          console.log(`no token for ${contractName}${i}`)
          token++
          if (token == 5) break
        }
      } catch (error) {
        console.log(`error for ${contractName}${i}`)
        break
      }
    }
    console.log(newList)
  }
}
