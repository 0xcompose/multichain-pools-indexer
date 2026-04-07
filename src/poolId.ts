export type PoolId = `${number}:${string}`

export function getPoolId(chainId: number, poolAddressOrId: string): PoolId {
	return `${chainId}:${poolAddressOrId}`
}
