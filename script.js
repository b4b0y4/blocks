import { ethers } from "./ethers.min.js"
import { isV2, contractsData } from "./contracts.js"
import { libs, list, curated } from "./lists.js"

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
const dropButton = document.getElementById("drop")
const dropdownMenu = document.getElementById("dropdownMenu")
const stopButton = document.getElementById("stop")

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

    const projIdPromise = fetchProjectId(tokenId, contract)
    const hashPromise = fetchHash(tokenId, contract)
    const ownerPromise = fetchOwner(tokenId, contract)

    const projId = Number(await projIdPromise)

    const projectInfoPromise = fetchProjectInfo(projId, contract, isContractV2)
    const detailPromise = fetchProjectDetails(projId, contract)
    const editionInfoPromise = fetchEditionInfo(projId, contract, isContractV2)

    const projectInfo = await projectInfoPromise

    const scriptPromise = constructScript(projId, projectInfo, contract)
    const extLibPromise = extractLibraryName(projectInfo)

    const [hash, { owner, ensName }, detail, script, editionInfo, extLib] =
      await Promise.all([
        hashPromise,
        ownerPromise,
        detailPromise,
        scriptPromise,
        editionInfoPromise,
        extLibPromise,
      ])

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
        edition: editionInfo.edition,
        remaining: editionInfo.remaining,
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
  const scriptPromises = []
  for (let i = 0; i < projectInfo.scriptCount; i++) {
    scriptPromises.push(contracts[contract].projectScriptByIndex(projId, i))
  }
  const scripts = await Promise.all(scriptPromises)
  return scripts.join("")
}

async function fetchProjectDetails(projId, contract) {
  return contracts[contract].projectDetails(projId)
}

async function fetchOwner(tokenId, contract) {
  const owner = await contracts[contract].ownerOf(tokenId)
  let ensName = null
  try {
    ensName = await provider.lookupAddress(owner)
  } catch (error) {
    ensName = null
  }
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
    edition: Number(invo.maxInvocations),
    remaining: Number(invo.maxInvocations - invo.invocations),
  }
}

async function updateContractData(tokenId, contract) {
  try {
    toggleSpin()
    clearPanels()
    console.log("Contract:", contract, "\nToken Id:", tokenId)

    const hashPromise = fetchHash(tokenId, contract)
    const ownerPromise = fetchOwner(tokenId, contract)
    const [hash, { owner, ensName }] = await Promise.all([
      hashPromise,
      ownerPromise,
    ])

    contractData.tokenId = tokenId
    contractData.hash = hash
    contractData.owner = owner
    contractData.ensName = ensName

    localStorage.setItem("contractData", JSON.stringify(contractData))

    location.reload()
  } catch (error) {
    console.error("updateContractData:", error)
    search.placeholder = "error"
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
    contract == 0
      ? `let tokenData = { tokenId: "${tokenId}", hashes: ["${hash}"] }`
      : `let tokenData = {tokenId: "${tokenId}", hash: "${hash}" }`
  let process = extLib == "processing" ? "application/processing" : ""

  localStorage.setItem(
    "scriptData",
    JSON.stringify({ src, tokenIdHash, process, script })
  )
}

function determineCuration(projId) {
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
    : "Art Blocks Presents"
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
  frame.contentWindow.console.log = function (message) {
    if (contractNameMap[contract] == "BMF" && logs.length === 0) {
      message = message.replace(/Artist\s*\d+\.\s*/, "").replace(/\s*--.*/, "")
      logs.push(message)
      artist = logs[0]
      updateInfo()
    }
  }

  const mintedOut =
    remaining == 0
      ? `Edition of ${edition} works.`
      : `Edition of ${edition} works, ${remaining} remaining.`

  const updateInfo = () => {
    info.innerHTML = `${detail[0]} #${shortId(tokenId)} / ${artist}`
    document.getElementById(
      "panelContent"
    ).innerHTML = `<p><span style="font-size: 1.4em">${detail[0]}</span><br>
        ${artist} ● ${platform}<br>
        ${mintedOut}</p><br>
      <p>${detail[2]} <a href="${detail[3]}" target="_blank">${extractDomain(
      detail[3]
    )}</a></p><br>
      <p>Owner <a href="https://zapper.xyz/account/${owner}" target="_blank">${
      ensName || shortAddr(owner)
    }</a><span class="copy-text" data-text="${owner}"><i class="fa-regular fa-copy"></i></span><br>
        Contract <a href="https://etherscan.io/address/${
          contracts[contract].target
        }" target="_blank">${shortAddr(
      contracts[contract].target
    )}</a><span class="copy-text" data-text="${
      contracts[contract].target
    }"><i class="fa-regular fa-copy"></i></span><br>
        Token Id <span class="copy-text" data-text="${tokenId}">${tokenId}<i class="fa-regular fa-copy"></i></span></p>`

    document.querySelectorAll(".copy-text").forEach((element) =>
      element.addEventListener("click", (event) => {
        const textToCopy = element.getAttribute("data-text")
        copyToClipboard(textToCopy)
        const toast = document.createElement("span")
        toast.classList.add("toast")
        toast.textContent = "Copied"
        element.querySelector("i").after(toast)
        setTimeout(() => {
          toast.remove()
        }, 1000)
      })
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

function extractDomain(url) {
  const match = url.match(/https?:\/\/(www\.)?([^\/]+)/)
  return match
    ? `<span class="domain-link"><i class="fa-solid fa-link"></i> ${match[2]}</span>`
    : ""
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
}

/***************************************************
 *        FUNCTION TO INJECT INTO IFRAME
 **************************************************/
async function injectFrame() {
  try {
    const iframeDocument = frame.contentDocument || frame.contentWindow.document
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

    let dynamicContent =
      contractData.extLib === "custom"
        ? `<script>${scriptData.tokenIdHash}</script>${scriptData.script}`
        : `<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1', maximum-scale=1>
      <script src='${scriptData.src || ""}'></script>
      <script>${scriptData.tokenIdHash};</script> <style type="text/css">
        html {height: 100%;}
        body {min-height: 100%; margin: 0; padding: 0; background-color: transparent;}
        canvas {padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0;}
      </style></head>${frameBody}</html>`

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
  if (searchQuery === "curated") {
    getRandom(filteredList)
  } else if (/^\d+$/.test(searchQuery)) {
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

  updateContractData(tokenId, contract)
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
  if (query.toLowerCase() === "curated") {
    filteredList = lines.filter((line) => {
      const idMatch = line.match(/^AB(?:III|II)?(\d+)/)
      if (idMatch) {
        const id = parseInt(idMatch[1])
        return curated.includes(id)
      }
    })
  } else {
    filteredList = lines.filter((line) =>
      line.toLowerCase().includes(query.toLowerCase())
    )
  }

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
let loopState = JSON.parse(localStorage.getItem("loopState")) || {
  isLooping: "false",
  interval: 60000,
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
  else if (action === "curatedLoop") {
    filterList(list, "curated")
    getRandom(filteredList)
  }
}

function stopRandomLoop() {
  clearInterval(intervalId)
  loopState.isLooping = "false"
  localStorage.setItem("loopState", JSON.stringify(loopState))
}

function checkLocalStorage() {
  loopInput.placeholder = `${loopState.interval / 60000}m`

  if (loopState.isLooping === "true" && loopState.action !== null)
    loopRandom(loopState.interval, loopState.action)
}

function handleLoopClick(action) {
  let inputValue = loopInput.value.trim()
  const inputVal = parseInt(inputValue, 10)

  const interval =
    loopState.interval &&
    (inputValue === "" || loopState.interval === inputVal * 60000)
      ? loopState.interval
      : inputVal * 60000

  if (!isNaN(interval) && interval > 0) {
    loopRandom(interval, action)
    toggleInfobar()
  } else {
    alert("Please enter a time in minutes.")
  }

  if (inputValue !== "" && interval !== loopState.interval) {
    loopState = { isLooping: "false", interval: interval, action: action }
    localStorage.setItem("loopState", JSON.stringify(loopState))
  }
}

function stopLoop() {
  stopRandomLoop()
  toggleInfobar()
}

/***************************************************
 *          FUNCTION TO SAVE THE OUTPUT
 **************************************************/
async function saveOutput() {
  clearPanels()
  const content = frame.contentDocument.documentElement.outerHTML
  let id = shortId(contractData.tokenId)
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
  updateContractData(contractData.tokenId, contractData.contract)
}

function decrementTokenId() {
  contractData.tokenId = contractData.tokenId - 1
  updateContractData(contractData.tokenId, contractData.contract)
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

function toggleInfobar() {
  const isInfobarInactive = infobar.classList.toggle("inactive")
  localStorage.setItem("infobarInactive", isInfobarInactive)
  if (loopState.isLooping !== "true") location.reload()
}

function updateButtons() {
  stopButton.style.display = loopState.isLooping === "true" ? "block" : "none"
  dropButton.style.display = loopState.isLooping === "true" ? "none" : "block"

  const isInfobarInactive = localStorage.getItem("infobarInactive") === "true"
  infobar.classList.toggle("inactive", isInfobarInactive)
  document.querySelector(
    isInfobarInactive ? ".fa-eye-slash" : ".fa-eye"
  ).style.display = "none"
}

/***************************************************
 *                     EVENTS
 **************************************************/
document.addEventListener("DOMContentLoaded", () => {
  updateButtons()
  checkLocalStorage()

  contractData = JSON.parse(localStorage.getItem("contractData"))
  if (contractData) update(...Object.values(contractData))

  const value = contractData ? "block" : "none"
  ;[inc, dec, save].forEach((el) => (el.style.display = value))

  const val = rpcUrl ? "none" : "block"
  ;[rpcUrlInput, instruction].forEach((el) => (el.style.display = val))

  if (!rpcUrl) document.getElementById("infoBox").style.display = "none"
  console.log(contractData)
  root.classList.remove("no-flash")
})

rpcUrlInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    localStorage.setItem("rpcUrl", rpcUrlInput.value)
    location.reload()
  }
})

document.addEventListener("keypress", (event) => {
  if (event.key === "\\") {
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

dropButton.addEventListener("click", function () {
  dropdownMenu.style.display =
    dropdownMenu.style.display === "block" ? "none" : "block"
})

document
  .getElementById("loop")
  .addEventListener("click", () => handleLoopClick("loop"))
document
  .getElementById("favLoop")
  .addEventListener("click", () => handleLoopClick("favLoop"))
document
  .getElementById("curatedLoop")
  .addEventListener("click", () => handleLoopClick("curatedLoop"))

stopButton.addEventListener("click", stopLoop)

document.getElementById("hideInfobar").addEventListener("click", toggleInfobar)

overlay.addEventListener("click", () => {
  clearPanels()
})

/***************************************************
 *              DARK/LIGHT MODE TOGGLE
 **************************************************/
const root = document.documentElement
const isDarkMode = JSON.parse(localStorage.getItem("darkMode"))

if (isDarkMode) root.classList.toggle("dark-mode")

document.getElementById("modeToggle").addEventListener("click", () => {
  root.classList.toggle("dark-mode")
  const updateMode = root.classList.contains("dark-mode")
  localStorage.setItem("darkMode", updateMode)
})

/***************************************************
 *         FUNCTION TO UPDATE THE LIST
 **************************************************/
const contractNames = ["ABSII", "ABSIII", "ABSIV", "AOI"]
// fetchBlocks(contractNames)

async function fetchBlocks(contractNames) {
  for (const contractName of contractNames) {
    const n = contractIndexMap[contractName]
    const isContractV2 = isV2.includes(contractName)
    const end = Number(await contracts[n].nextProjectId())
    const iStart =
      contractName === "ABII"
        ? 3
        : contractName === "ABIII"
        ? 374
        : contractName === "ABXPACEII"
        ? 5
        : ["GRAIL", "HODL", "UNITLDN", "GLITCH"].includes(contractName)
        ? 1
        : 0
    let newList = ""

    for (let i = iStart; i < end; i++) {
      const [detail, token] = await Promise.all([
        contracts[n].projectDetails(i.toString()),
        isContractV2
          ? contracts[n].projectTokenInfo(i)
          : contracts[n].projectStateData(i),
      ])

      if (token.invocations > 0) {
        newList += `"${contractName}${i} - ${detail[0]} / ${detail[1]} - ${token.invocations} minted", `
      } else {
        console.log(`no token for ${contractName}${i}`)
      }
    }
    console.log(newList)
  }
}
