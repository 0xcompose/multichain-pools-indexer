/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { PoolManager, CLPoolManager } from "generated"
import { HandlerContext } from "generated/src/Types"
import {
	incrementChainMetricsForPool,
	incrementChainMetricsTokenCount,
	setTokenWithPoolCount,
} from "./metrics"
import { globalHandlerConfig } from "./handlerConfig"
import { getTokenId } from "./tokenId"
import { Protocol } from "./protocols"
import { getPoolId, getPoolTokenId, PoolId } from "./poolId"

type EventWithCurrency0AndCurrency1 = {
	chainId: number
	params: {
		currency0: string
		currency1: string
	}
}

async function addCurrencies0And1AndPoolTokens(
	poolId: PoolId,
	event: EventWithCurrency0AndCurrency1,
	context: HandlerContext,
	protocol: Protocol,
): Promise<void> {
	const token0Id = getTokenId(event.chainId, event.params.currency0)
	const token1Id = getTokenId(event.chainId, event.params.currency1)

	const r0 = await setTokenWithPoolCount(
		context,
		token0Id,
		event.chainId,
		event.params.currency0,
		1,
	)
	const r1 = await setTokenWithPoolCount(
		context,
		token1Id,
		event.chainId,
		event.params.currency1,
		1,
	)

	let newTokenCount = 0

	if (r0.isNew) newTokenCount++
	if (r1.isNew) newTokenCount++

	if (newTokenCount > 0) {
		await incrementChainMetricsTokenCount(
			context,
			event.chainId,
			newTokenCount,
		)
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

	await incrementChainMetricsForPool(context, event.chainId, protocol)
}

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

	await addCurrencies0And1AndPoolTokens(
		id,
		event,
		context,
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

	await addCurrencies0And1AndPoolTokens(
		id,
		event,
		context,
		Protocol.PancakeSwapInfinity,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.id,
		protocol: Protocol.PancakeSwapInfinity,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.PancakeSwapInfinityPoolImmutables.set({
		id,
		fee: event.params.fee,
		hooks: event.params.hooks,
		parameters: event.params.parameters,
	})
}, globalHandlerConfig)
