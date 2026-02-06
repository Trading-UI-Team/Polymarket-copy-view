import { ethers } from 'ethers'

export const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
export const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)']

export async function getUsdcBalance(address: string, retryCount = 0): Promise<number> {
    const config = useRuntimeConfig()
    const rpcUrl = config.rpcUrl as string
    const MAX_RETRIES = 2

    if (!rpcUrl) {
        console.error('RPC_URL is not set')
        return 0
    }

    try {
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl)
        const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, rpcProvider)
        const balanceUsdc = await usdcContract.getFunction('balanceOf')(address)
        const balanceUsdcReal = ethers.formatUnits(balanceUsdc, 6)
        return parseFloat(balanceUsdcReal)
    } catch (e) {
        console.error(`[balance util] Error fetching balance (attempt ${retryCount + 1}):`, e)

        if (retryCount < MAX_RETRIES) {
            console.log(`[balance util] Retrying in 0.2 second...`)
            await new Promise(resolve => setTimeout(resolve, 200))
            return getUsdcBalance(address, retryCount + 1)
        }

        return 0
    }
}
