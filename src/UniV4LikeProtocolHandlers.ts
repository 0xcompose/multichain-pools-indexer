/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
	UniV4PoolManager_Initialize,
	PoolManager,
	CLPoolManager_Initialize,
	CLPoolManager,
} from "generated"
import { HandlerContext } from "generated/src/Types"
import {
	incrementChainMetricsForPool,
	incrementChainMetricsTokenCount,
	setTokenWithPoolCount,
} from "./metrics"
import { globalHandlerConfig } from "./handlerConfig"
import { getEventId } from "./eventId"
import { getTokenId } from "./tokenId"
import { Protocol } from "./protocols"

type EventWithCurrency0AndCurrency1 = {
	chainId: number
	params: {
		currency0: string
		currency1: string
	}
}

async function addCurrencies0And1AndPoolTokens(
	poolId: string,
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
		id: `${poolId}:${token0Id}:0`,
		pool_id: poolId,
		token_id: token0Id,
		tokenIndex: 0,
	})

	context.PoolToken.set({
		id: `${poolId}:${token1Id}:1`,
		pool_id: poolId,
		token_id: token1Id,
		tokenIndex: 1,
	})

	await incrementChainMetricsForPool(context, event.chainId, protocol)
}

PoolManager.Initialize.handler(async ({ event, context }) => {
	const poolId = `${event.chainId}:${event.params.id}`

	const entity: UniV4PoolManager_Initialize = {
		id: getEventId(event),
		poolId: event.params.id,
		currency0: event.params.currency0,
		currency1: event.params.currency1,
		fee: event.params.fee,
		tickSpacing: event.params.tickSpacing,
		hooks: event.params.hooks,
		sqrtPriceX96: event.params.sqrtPriceX96,
		tick: event.params.tick,
	}

	context.Pool.set({
		id: poolId,
		chainId: event.chainId,
		address: event.params.id,
		protocol: Protocol.UniswapV4,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	await addCurrencies0And1AndPoolTokens(
		poolId,
		event,
		context,
		Protocol.UniswapV4,
	)

	context.UniV4PoolManager_Initialize.set(entity)
}, globalHandlerConfig)

CLPoolManager.Initialize.handler(async ({ event, context }) => {
	const poolId = `${event.chainId}:${event.params.id}`

	const entity: CLPoolManager_Initialize = {
		id: getEventId(event),
		poolId: event.params.id,
		currency0: event.params.currency0,
		currency1: event.params.currency1,
		hooks: event.params.hooks,
		fee: event.params.fee,
		parameters: event.params.parameters,
		sqrtPriceX96: event.params.sqrtPriceX96,
		tick: event.params.tick,
	}

	await addCurrencies0And1AndPoolTokens(
		poolId,
		event,
		context,
		Protocol.PancakeSwapInfinity,
	)

	context.Pool.set({
		id: poolId,
		chainId: event.chainId,
		address: event.params.id,
		protocol: Protocol.PancakeSwapInfinity,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.CLPoolManager_Initialize.set(entity)
}, globalHandlerConfig)
