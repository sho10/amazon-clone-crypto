import { createContext, useState, useEffect } from 'react'
import { useMoralis, useMoralisQuery } from 'react-moralis'
import { amazonAbi, amazonCoinAddress } from '../lib/constants'
import { ethers } from 'ethers'
export const AmazonContext = createContext()

export const AmazonProvider = ({children}) => {
  const [username, setUsername] = useState('')
  const [nickname, setNickName] = useState('')
  const [assets, setAssets] = useState([])
  const [currentAccount, setCurrentAccount] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [etherscanLink, setEtherscanLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState('')
  const [ownedItems, setOwnedItems] = useState([])

  const {
    authenticate,
    isAuthenticated,
    enableWeb3,
    Moralis,
    user,
    isWeb3Enabled
  } = useMoralis()

  const {
    data: userData,
    error: userDataError,
    isLoading: userDataIsLoading
  } = useMoralisQuery('_User')

  const {
    data: assetsData,
    error: assetsDataError,
    isLoading: assetsDataIsLoading,
  } = useMoralisQuery('assets')

  useEffect(() => {
    ;(async() => {
      console.log(assetsData)
      await enableWeb3()
      await getAssets()
      await getOwnedAssets()
    })()
  }, [userData, assetsData, assetsDataIsLoading, userDataIsLoading])

  useEffect(() => {
    ;(async() => {
      if(isAuthenticated) {
        await getBalance()
        const currentUserName = await user?.get('nickname')
        setUsername(currentUserName)
        const account = await user?.get('ethAddress')
        setCurrentAccount(account)
      }
    })()
  }, [isAuthenticated, user, username, currentAccount])

  const handleSetUsername = () => {
    if(user) {
      if(nickname) {
        user.set('nickname',nickname)
        user.save()
        setNickName('')
      } else {
        console.log("Can't set empty nickname")
      }
    } else {
      console.log('No user')
    }
  }

  const getBalance = async () => {
    try {
      if (!isAuthenticated || !currentAccount) return
      const options = {
        contractAddress: amazonCoinAddress,
        functionName: 'balanceOf',
        abi: amazonAbi,
        params: {
        account: currentAccount
      }
      }
      if (isWeb3Enabled) {
        const response = await Moralis.executeFunction(options)
        setBalance(response.toString())
      }
    } catch(error) {

    }
  }

  const buyAsset = async (price, asset) => {
    try {
      if (!isAuthenticated) return
      console.log('price: ', price)
      console.log('asset: ', asset.name)
      console.log(userData)
      const options = {
        type: 'erc20',
        amount: price,
        receiver: amazonCoinAddress,
        contractAddress:amazonCoinAddress
      }
      let transaction = await Moralis.transfer(options)
      const receipt = await transaction.wait()

      if (receipt) {
        const res = userData[0].add('ownedAsset', {
          ...asset,
          purchaseDate: Date.now(),
          etherscanLink: `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`,
        })

        await res.save().then(() => {
          alert("You've successfully purchased this asset!")
        })
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const buyTokens = async () => {
    if (!isAuthenticated) {
      await connectWallet()
    }
    const amount = ethers.BigNumber.from(tokenAmount)
    const price = ethers.BigNumber.from('100000000000000')
    const calcPrice = amount.mul(price)

    let options = {
      contractAddress: amazonCoinAddress,
      functionName: 'mint',
      abi: amazonAbi,
      msgValue: calcPrice,
      params: {
        amount
      }
    }

    const transaction = await Moralis.executeFunction(options)
    const receipt = await transaction.wait()
    setIsLoading(false)
    console.log(receipt)
    setEtherscanLink(
      `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`
    )
  }

  const getAssets = async () => {
    try{
      await enableWeb3()
      setAssets(assetsData)
    } catch (error) {
      console.log(error)
    }
  }

  const getOwnedAssets = async () => {
    try {
      if (userData[0]) {
        setOwnedItems(prevItems => [
          ...prevItems,
          userData[0].attributes.ownedAsset
        ])
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <AmazonContext.Provider
    value={{
      isAuthenticated,
      nickname,
      setNickName,
      username,
      setUsername,
      handleSetUsername,
      balance,
      buyTokens,
      setTokenAmount,
      tokenAmount,
      amountDue,
      setAmountDue,
      buyAsset,
      isLoading,
      assets,
      setIsLoading,
      setEtherscanLink,
      etherscanLink,
      currentAccount
    }}
    >
      {children}
    </AmazonContext.Provider>
  )
}