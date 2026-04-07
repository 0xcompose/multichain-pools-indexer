import type { HandlerContext } from "generated/src/Types"
import {
	incrementChainMetricsForPool,
	incrementChainMetricsTokenCount,
	setTokenWithPoolCount,
} from "./metrics"
import { getPoolTokenId, type PoolId } from "./poolId"
import { Protocol } from "./protocols"
import { getTokenId } from "./tokenId"

/**
 * Upserts both tokens, links them to the pool via PoolToken rows, updates token/pool chain metrics.
 */
export async function addTwoAssetPoolTokensAndMetrics(
	context: HandlerContext,
	chainId: number,
	poolId: PoolId,
	token0Address: string,
	token1Address: string,
	protocol: Protocol,
): Promise<void> {
	const token0Id = getTokenId(chainId, token0Address)
	const token1Id = getTokenId(chainId, token1Address)

	const r0 = await setTokenWithPoolCount(
		context,
		token0Id,
		chainId,
		token0Address,
		1,
	)
	const r1 = await setTokenWithPoolCount(
		context,
		token1Id,
		chainId,
		token1Address,
		1,
	)

	let newTokenCount = 0

	if (r0.isNew) newTokenCount++
	if (r1.isNew) newTokenCount++

	if (newTokenCount > 0) {
		await incrementChainMetricsTokenCount(context, chainId, newTokenCount)
	}

	context.PoolToken.set({
		id: getPoolTokenId(poolId, 0),
		pool_id: poolId,
		token_id: token0Id,
		tokenIndex: 0,
	})

	context.PoolToken.set({
		id: getPoolTokenId(poolId, 1),
		pool_id: poolId,
		token_id: token1Id,
		tokenIndex: 1,
	})

	await incrementChainMetricsForPool(context, chainId, protocol)
}
