import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const provider = new ethers.providers.JsonRpcProvider("https://eth.llamarpc.com")
const contract = new ethers.Contract(contractAddress, abi, provider)

const tokenIdInput = document.getElementById("tokenId")
const showButton = document.getElementById("showButton")

async function show() {
    let tokenId = tokenIdInput.value;
    try {
       let hash = await contract.tokenIdToHash(tokenId)
        let projId = await contract.tokenIdToProjectId(tokenId)
        let projectId = projId.toString()
        let projectInfo = await contract.projectScriptInfo(projId)
        let scriptCount = projectInfo[1].toNumber()
        let script = ""
        
        for (let i = 0; i < scriptCount; i++) {
            const scrpt = await contract.projectScriptByIndex(projectId, i)
            script += scrpt
        }

        console.log("token Id is:", tokenId)
        console.log("Hash is:", hash)
        console.log("Project ID is:", projectId)
        console.log("Script count is:", scriptCount)
        console.log("Script is:", script)

        update(tokenId, hash, script)

    } catch (error) {
        console.error("Error:", error)
    }
}

function update(tokenId, hash, script) {

    // Create a new script element for token data and append it to the head
    let tokenData = document.createElement("script");
    tokenData.innerText = `let tokenData = {
        "tokenId": "${tokenId}",
         "hash": "${hash}"
     }`
    document.head.appendChild(tokenData);

    // Create a new script element for art code and append it to the body
    let artCode = document.createElement("script");
    artCode.innerText = script;
    document.body.appendChild(artCode);

    console.log(tokenData.innerText);
    console.log(artCode.innerText);
}


showButton.addEventListener("click", show)