import { useState } from 'react'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import { pinataKey } from '../.env'

import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()

  /* ------------- TEST PINATA ----------------- */
  async function onChange(e) {
    const fileRecieved = e.target.files[0]
    if (!fileRecieved) {
      return;
    }
    
    const formdata = new FormData();
    formdata.append("file", fileRecieved, "[PROXY]");
    formdata.append("pinataOptions", "{\"cidVersion\": 1}");
    formdata.append("pinataMetadata", "{\"name\": \"MyFile\", \"keyvalues\": {\"company\": \"Pinata\"}}");

    const url = await uploadToIPFS(formdata, false);
    
    const img = url.replace("ipfs://", "https://promptmarketplace.mypinata.cloud/ipfs/");
    setFileUrl(img);
  }
  
  async function uploadToIPFS(body, typeJSON) {
    let myHeaders = new Headers();
    let fetchUrl;
    //myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlZWZlODkwMy05ODlkLTQ5NjUtYmJiYS0xNGM0NjQ1ZTRiYTIiLCJlbWFpbCI6ImF1cm9yYS5tYWtvdmFjQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5NzFlMDI1YjY0N2IyNmRjYWZjMCIsInNjb3BlZEtleVNlY3JldCI6Ijc3MmE5NzZkNDBlZWRmZGQ2MzA2NjE0YmJhOTA1ZGNmMmVjYThkZDY0ZDFiODIyZDkxMzU4OTI4ZmFkOTkzNjciLCJpYXQiOjE2Njc5OTI0NzB9.rh3B-mY_Rz_ihOqFNbMEOgbHMnp8MQWLfDIrMQUmTGg");
    myHeaders.append("Authorization", "Bearer " + pinataKey);
    if (typeJSON) {
      myHeaders.append("Content-Type", "application/json");
      fetchUrl = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
    }
    else {
      fetchUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    }

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: body,
      redirect: 'follow'
    };

    console.log("Waiting for response");

    return new Promise((resolve, reject) => {
      fetch(fetchUrl, requestOptions)
        .then(response => response.json())
        .then(result => {
          console.log(result)
          const url = `ipfs://${result["IpfsHash"]}`
          resolve(url);
        })
        .catch(error => {
          console.log('error', error);
          reject(error);
        });

    })
  }

  async function listNFTForSale() {
    const { name, description, price } = formInput
    const file = fileUrl.replace("https://promptmarketplace.mypinata.cloud/ipfs/", "ipfs://");

    if (!name || !description || !price || !fileUrl) return

    const raw = JSON.stringify({
      "pinataOptions": {
        "cidVersion": 1
      },
      "pinataMetadata": {
        "name": "testing",
        "keyvalues": {
          "company": "Pinata"
        }
      },
      "pinataContent": {
        "name": name,
        "description": description,
        "imageUrl": file
      }
    });

    const url = await uploadToIPFS(raw, true);
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    const priceEthers = ethers.utils.parseUnits(formInput.price, 'ether')
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()
    console.log(url);
    let transaction = await contract.createToken(url, priceEthers, { value: listingPrice })
    await transaction.wait()
   
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )
        }
        <button onClick={listNFTForSale} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create NFT
        </button>

      </div>
    </div>
  )
}