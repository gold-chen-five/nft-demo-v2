import React from 'react'
import type { GetServerSideProps } from 'next'
import { useAddress, useDisconnect, useMetamask } from "@thirdweb-dev/react";
import { sanityClient, urlFor } from '../../sanity'
import { Collection } from '../../typings'
import Link from 'next/link'

interface Props{
    collection: Collection
}
function NFTDropPage({ collection }: Props) {
  
  //Auth
  const connectWithMetamask = useMetamask()
  const address = useAddress()
  const disconnect = useDisconnect()
  
  return (
    <div className='flex f-screen flex-col lg:grid lg:grid-cols-10'>
        {/* left */}
        <div className='bg-gradient-to-br from-cyan-800 to-rose-500 flex flex-col items-center justify-center py-2 lg:min-h-screen lg:col-span-4'>
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
        <div className='flex flex-1 flex-col p-12 lg:col-span-6'>
            {/* Header */}
           
                <header className='flex items-center justify-between'>
                    <Link href="/"> 
                        <h1 className='w-52 cursor-pointer text-xl font-extralight sm:w-80'>The
                        <span className='font-extrabold underline decoration-pink-600/50'> Phalanity </span> 
                            NFT Market place
                        </h1>
                    </Link>
                    <button className='rounded-full bg-rose-400 text-white px-4 py-2 text-xs font-bold lg:px-5 lg:py-3 lg:text-base' onClick={() => (address ? disconnect() : connectWithMetamask())}>{address ? "Sign Out" : "Sign In"}</button>
                </header>
            
           
            <hr className='my-2 border'/>
            { address && <p className='text-center text-sm text-rose-400'>You're logged in with wallet {address.substring(0,5)}...{address.substring(address.length - 5)}</p>}

            {/* Content */}
            <div className='mt-10 flex flex-1 flex-col items-center space-y-6 text-center mb-4 lg:space-y-0 lg:justify-center '>
                <img src={urlFor(collection.mainImage).url()} alt="" className='w-80 h-auto object-cover pb-10'/>
                <h1 className='text-3xl font-bold lg:text-5xl lg:font-extrabold'>{ collection.title}</h1>
                <p className='pt-2 text-xl text-green-500'>13 / 21 NFT'S claimed</p>
            </div>

            {/* Mint button  */}
            <button className='h-14 w-full bg-red-500 text-white rounded-full '>Mint NFT (0.01 ETH)</button>
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