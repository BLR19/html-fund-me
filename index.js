import { ethers } from "./ethers-5.6.esm.min.js" //Plus safe de copier la librairie en local et de l'importer comme ca si on travaille avec du raw html+javascript
import { abi, contractAddress } from "./constants.js" //Copier ABI du contract.json

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw

console.log(ethers)

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
            await ethereum.request({ method: "eth_requestAccounts" })
        } catch (error) {
            console.log(error)
        }
        connectButton.innerHTML = "Connected"
        const accounts = await ethereum.request({ method: "eth_accounts" })
        console.log(accounts) //affiche l'adresse du wallet connecté
    } else {
        connectButton.innerHTML = "Please install MetaMask"
    }
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const balance = await provider.getBalance(contractAddress)
        console.log(`${ethers.utils.formatEther(balance)} ETH`)
    }
}

async function fund(ethAmount) {
    ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount} ETH...`)
    if (typeof window.ethereum !== "undefined") {
        //1. Provider / connection to the blockchain
        const provider = new ethers.providers.Web3Provider(window.ethereum) //Va chercher le RPC url du wallet connecté pour interagir avec la blockchain
        //2. signer / Wallet with gas
        const signer = provider.getSigner() //Se sert du Wallet avec le Endpoint comme Signer
        //3. Smart contract that we are interacting with (ABI + Address)
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            })
            //Wait for the tx to finish !
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
        } catch (error) {
            console.log(error)
        }
        //Let's let the user know everything went through by listening to the blockchain (see function below)
    }
}

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        console.log('Withdrawing...')
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
        } catch (error) {
            console.log(error)
        }
    }
}


function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}...`)
    return new Promise((resolve, reject) => {
        //provider.once is considered on its own, and JS keep going upthere and check back time to time if the event is triggered
        //return new Promise makes us able to wait a response Promise before going back upthere
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            //Once we have transactionResponse.hash, a listener is triggered (once) --- here this is an anonymous function
            console.log(
                `Completed with ${transactionReceipt.confirmations} confirmations`
            )
            resolve()
        })
    })
}

