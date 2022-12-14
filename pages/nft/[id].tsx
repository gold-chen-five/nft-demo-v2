import React,{ useEffect, useState} from 'react'
import type { GetServerSideProps } from 'next'
import { useAddress, useDisconnect, useMetamask, useNFTDrop} from "@thirdweb-dev/react";
import { sanityClient, urlFor } from '../../sanity'
import { Collection } from '../../typings'
import Link from 'next/link'
import { BigNumber } from 'ethers'
import toast, { Toaster } from 'react-hot-toast'

interface Props{
    collection: Collection
}
interface NftMetadata{
    attributes: [
        {
            trait_type: string,
            value: string
        }
    ],
    image: string | undefined,
    name: string | undefined
}

function NFTDropPage({ collection }: Props) {
  const [claimedSupply,setClaimedSupply] = useState<number>(0)
  const [totalSupply,setTotalSupply] = useState<BigNumber>()
  const [loading,setLoading] = useState<boolean>(true)
  const [price,setPrice] = useState<string>()
  const [myNFTs,setMyNFTs] = useState<NftMetadata[]>()
  const nftDrop = useNFTDrop(collection.address)

  //Auth
  const connectWithMetamask = useMetamask()
  const address = useAddress()
  const disconnect = useDisconnect()

  useEffect(() => {
    if(!nftDrop) return

    const fetchPrice = async () => {
        const claimConditions = await nftDrop?.claimConditions.getAll()
        setPrice(claimConditions?.[0].currencyMetadata.displayValue)
    } 
    fetchPrice()
  },[nftDrop])

  useEffect(() => {
    if(!nftDrop) return

    const fetchNFTDropData = async () => {
        setLoading(true)

        const claimed = await nftDrop.getAllClaimed()
        const total = await nftDrop.totalSupply()
        setClaimedSupply(claimed.length)
        setTotalSupply(total)

        setLoading(false)
    }

    fetchNFTDropData()
  },[nftDrop])

  //Mint--
  const mintNFT = async () => {
    if(!nftDrop || !address) return

    const quantity = 1

    setLoading(true)
    const notification = toast.loading('Minting...', {
        style: {
            background: 'white',
            color: 'green',
            fontWeight: 'bolder',
            fontSize: '17px',
            padding: '20px'
        }
    })

    try{
        const tx = await nftDrop.claimTo(address, quantity)
        const receipt = tx[0].receipt
        const claimedTokendId = tx[0].id
        const claimedNFT = await tx[0].data()
        
        toast('Successful Minting...',{
            duration: 8000,
            style:{
                background: 'green',
                color: 'white',
                fontWeight: 'bolder',
                fontSize: '17px',
                padding: '20px'
            }
        })

        console.log(receipt)
        console.log(claimedTokendId)
        console.log(claimedNFT)
    }
    catch(err){
        console.log(err)
        toast('Something went wrong!',{
            duration: 8000,
            style:{
                background: 'red',
                color: 'white',
                fontWeight: 'bolder',
                fontSize: '17px',
                padding: '20px'
            }
        })
    }
    finally{
        setLoading(false)
        toast.dismiss(notification)
    }
  }

  //---get owner nft---
  useEffect(() => {
    if(!address) return
    const getNFTmetadata = async () => {
        const nfts = await nftDrop?.getOwned(address)
        if(nfts === undefined){
            return
        }
        const newArr = nfts?.map(nft => {
            const { metadata } = nft
            return {
                attributes: metadata.attributes as [
                    {
                        trait_type: string,
                        value: string
                    }
                ],
                image: metadata.image as string | undefined,
                name: metadata.name,
            }
        })
        console.log(newArr)
        setMyNFTs(newArr)
    }
    getNFTmetadata()
  },[nftDrop])

  // lg:grid lg:grid-cols-10 lg:col-span-4  lg:col-span-6
  return (
    <div className='flex flex-col w-full lg:grid lg:grid-cols-10'>
        <Toaster position='bottom-center'/>

        {/* left */}
        <div className='bg-gradient-to-br from-cyan-800 to-rose-500 flex flex-col items-center justify-center py-2 lg:min-h-screen lg:sticky lg:left-0 lg:top-0 lg:col-span-4 lg:h-screen'>
            <div className='bg-gradient-to-br from-yellow-400 to-purple-600 p-2 rounded-xl'>
                <img className="w-96 h-auto rounded-xl object-cover lg:w-72" src={urlFor(collection.previewImage).url()} alt="" />
            </div>
            <div className='text-center p-5 space-y-2'>
                <h1 className='text-4xl font-bold text-white '>
                   {collection.nftCollectionName}
                </h1>
                <h2 className='text-xl text-gray-300'>{collection.description}</h2>
            </div>
        </div>

        {/* Right */}
        <div className='flex flex-1 flex-col px-12 pb-12 lg:col-span-6'>
            {/* Header */}
           
            <header className='lg:sticky lg:top-0 right-0 pt-12 lg:bg-white h-[20vh]'>
                <div className='flex items-center justify-between'>
                    <Link href="/"> 
                        <h1 className='w-52 cursor-pointer text-xl font-extralight sm:w-80'>The
                        <span className='font-extrabold underline decoration-pink-600/50'> Phalanity </span> 
                            NFT Market place
                        </h1>
                    </Link>
                    <button className='rounded-full bg-rose-400 text-white px-4 py-2 text-xs font-bold lg:px-5 lg:py-3 lg:text-base' onClick={() => (address ? disconnect() : connectWithMetamask())}>{address ? "Sign Out" : "Sign In"}</button>
                </div>
                <hr className='my-2 border'/>
                
            </header>
            { address && <p className='text-center text-sm text-rose-400'>You're logged in with wallet {address.substring(0,5)}...{address.substring(address.length - 5)}</p>} 

            <div className='h-[80vh] flex flex-col justify-center'>
                {/* Content */}
                <div className='mt-10 flex flex-1 flex-col items-center space-y-6 text-center mb-4 lg:space-y-0 lg:justify-center '>
                    <img src={urlFor(collection.mainImage).url()} alt="" className='w-80 h-auto object-cover pb-10'/>
                    <h1 className='text-3xl font-bold lg:text-5xl lg:font-extrabold pb-6'>{ collection.title}</h1>

                    {loading ? (
                        <p className='pt-2 text-xl text-green-500 animate-bounce'> Loading Supply count...</p>
                    ) : (
                        <p className='pt-2 text-xl text-green-500'>{claimedSupply} / {totalSupply?.toString()} NFT'S claimed</p>
                    )
                    }
                    
                    {
                        loading && <img src="/loading.gif" alt="" className='w-80 h-40 object-contain'/>
                    }
                </div>

                {/* Mint button  */}

                <button disabled={loading || claimedSupply === totalSupply?.toNumber() || !address} onClick={mintNFT} className='h-14 w-full bg-red-500 text-white rounded-full disabled:bg-red-100'>
                    {
                        loading ? (
                            <>Loading</>
                        ) : claimedSupply === totalSupply?.toNumber() ? (
                            <>SOLD OUT</>
                        ) : !address ? (
                            <>Sign in to Mint</>
                        ) : (
                            <>Mint NFT ({price} eth)</>
                        )
                    }
                </button>
                <div className='flex flex-col items-center'>
                    <img src="/scrolldown.gif" alt="" className='h-20 w-20'/>
                </div>
            </div>
            
            {
                address &&  (
                    <div className='min-h-screen pt-[30vh]'>
                        <h1 className='text-3xl font-bold text-center pb-20'>Your Phalanity NFT.</h1>
                        <div className='flex flex-col lg:grid lg:grid-cols-10 items-center'>
                        {
                            myNFTs?.map( (nft,item) => (
                                <div key={item} className="lg:col-span-3">
                                    <img src={nft.image} alt="" className='h-60 w-60'/>
                                    <p className='font-bold'>{nft.name}</p>
                                </div>
                            ))
                        }
                        </div>
                        
                    </div>
                )
            }
           
        </div>
    </div>
  )
}

export default NFTDropPage

export const getServerSideProps: GetServerSideProps = async ({params}) => {
    const query = `*[_type == "collection" && slug.current == $id][0]{
        _id,
        title,
        address,
        nftCollectionName,
        description,
        mainImage {
            asset
        },
        previewImage {
            asset
        },
        slug {
            current
        },
        creator-> {
            _id,
            name,
            address,
            slug {
            current
            },
        },
    }`
    
    const collection = await sanityClient.fetch(query,{
        id: params?.id
    })
    if(!collection){
        return {
            notFound: true
        }
    }
    return {
        props:{
            collection
        }
    }
}