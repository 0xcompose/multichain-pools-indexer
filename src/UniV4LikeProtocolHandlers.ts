/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, CLPoolManager } from "generated"
import { globalHandlerConfig } from "./handlerConfig"
import { Protocol } from "./protocols"
import { getPoolId } from "./poolId"
import { addTwoAssetPoolTokensAndMetrics } from "./twoAssetPoolTokens"

PoolManager.Initialize.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.id)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.id,
		protocol: Protocol.UniswapV4,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.currency0,
		event.params.currency1,
		Protocol.UniswapV4,
	)

	context.UniswapV4PoolImmutables.set({
		id,
		fee: event.params.fee,
		tickSpacing: event.params.tickSpacing,
		hooks: event.params.hooks,
	})
}, globalHandlerConfig)

CLPoolManager.Initialize.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.id)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.id,
		protocol: Protocol.PancakeSwapInfinity,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.currency0,
		event.params.currency1,
		Protocol.PancakeSwapInfinity,
	)

	context.PancakeSwapInfinityPoolImmutables.set({
		id,
		fee: event.params.fee,
		hooks: event.params.hooks,
		parameters: event.params.parameters,
	})
}, globalHandlerConfig)
