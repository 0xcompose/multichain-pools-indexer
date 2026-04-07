import { BalancerV2Vault, BalancerV3Vault } from "generated"
import {
	incrementChainMetricsForPool,
	incrementChainMetricsTokenCount,
	setTokenWithPoolCount,
} from "./metrics"
import { getTokenId } from "./tokenId"
import { globalHandlerConfig } from "./handlerConfig"
import { Protocol } from "./protocols"
import { getPoolId, getPoolTokenId } from "./poolId"

BalancerV2Vault.PoolRegistered.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.poolId)

	await incrementChainMetricsForPool(
		context,
		event.chainId,
		Protocol.BalancerV2,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.poolAddress,
		protocol: Protocol.BalancerV2,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.BalancerV2PoolImmutables.set({
		id,
		specialization: event.params.specialization.toString(),
	})
}, globalHandlerConfig)

BalancerV3Vault.PoolRegistered.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await incrementChainMetricsForPool(
		context,
		event.chainId,
		Protocol.BalancerV3,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pool,
		protocol: Protocol.BalancerV3,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	const tokenConfigs = event.params.tokenConfig
	let newTokenCount = 0

	for (let i = 0; i < tokenConfigs.length; i++) {
		const tokenAddress = tokenConfigs[i][0]
		const tokenId = getTokenId(event.chainId, tokenAddress)

		const { isNew } = await setTokenWithPoolCount(
			context,
			tokenId,
			event.chainId,
			tokenAddress,
			1,
		)
		if (isNew) newTokenCount++

		context.PoolToken.set({
			id: getPoolTokenId(id, i),
			pool_id: id,
			token_id: tokenId,
			tokenIndex: i,
		})
	}
	if (newTokenCount > 0) {
		await incrementChainMetricsTokenCount(
			context,
			event.chainId,
			newTokenCount,
		)
	}

	context.BalancerV3PoolImmutables.set({
		id,
		factory: event.params.factory,
		swapFeePercentage: event.params.swapFeePercentage,
	})
}, globalHandlerConfig)
