export type PoolId = `${number}:${string}`

export function getPoolId(chainId: number, poolAddressOrId: string): PoolId {
	return `${chainId}:${poolAddressOrId}`
}

/** Stable PoolToken primary key: one row per (pool, index); avoids repeating chainId from token_id in the id string. */
export function getPoolTokenId(poolId: PoolId, tokenIndex: number): string {
	return `${poolId}:${tokenIndex}`
}
