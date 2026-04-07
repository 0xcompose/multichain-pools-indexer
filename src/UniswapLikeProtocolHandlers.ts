/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
	AlgebraIntegral,
	UniswapV2Factory,
	UniswapV3Factory,
	VelodromeSlipstreamCLFactory,
	VelodromeCPMMFactory,
} from "generated"
import { HandlerContext } from "generated/src/Types"
import {
	incrementChainMetricsForPool,
	incrementChainMetricsTokenCount,
	setTokenWithPoolCount,
} from "./metrics"
import { globalHandlerConfig } from "./handlerConfig"
import { getTokenId } from "./tokenId"
import { Protocol } from "./protocols"
import { getPoolId } from "./poolId"

type EventWithToken0AndToken1 = {
	chainId: number
	params: {
		token0: string
		token1: string
	}
}

async function addTokens0And1AndPoolTokens(
	poolId: string,
	event: EventWithToken0AndToken1,
	context: HandlerContext,
	protocol: Protocol,
): Promise<void> {
	const token0Id = getTokenId(event.chainId, event.params.token0)
	const token1Id = getTokenId(event.chainId, event.params.token1)

	const r0 = await setTokenWithPoolCount(
		context,
		token0Id,
		event.chainId,
		event.params.token0,
		1,
	)
	const r1 = await setTokenWithPoolCount(
		context,
		token1Id,
		event.chainId,
		event.params.token1,
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

AlgebraIntegral.CustomPool.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await addTokens0And1AndPoolTokens(
		id,
		event,
		context,
		Protocol.AlgebraIntegral,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pool,
		protocol: Protocol.AlgebraIntegral,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.AlgebraIntegralPoolImmutables.set({
		id,
		deployer: event.params.deployer,
		tickSpacing: undefined,
	})
}, globalHandlerConfig)

AlgebraIntegral.Pool.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await addTokens0And1AndPoolTokens(
		id,
		event,
		context,
		Protocol.AlgebraIntegral,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pool,
		protocol: Protocol.AlgebraIntegral,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.AlgebraIntegralPoolImmutables.set({
		id,
		// Other events should be indexed to identify those parameters
		deployer: undefined,
		tickSpacing: undefined,
	})
}, globalHandlerConfig)

UniswapV2Factory.PairCreated.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pair)

	await addTokens0And1AndPoolTokens(id, event, context, Protocol.UniswapV2)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pair,
		protocol: Protocol.UniswapV2,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})
}, globalHandlerConfig)

UniswapV3Factory.PoolCreated.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await addTokens0And1AndPoolTokens(id, event, context, Protocol.UniswapV3)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pool,
		protocol: Protocol.UniswapV3,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.UniswapV3PoolImmutables.set({
		id,
		fee: event.params.fee,
		tickSpacing: event.params.tickSpacing,
	})
}, globalHandlerConfig)

VelodromeSlipstreamCLFactory.PoolCreated.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await addTokens0And1AndPoolTokens(
		id,
		event,
		context,
		Protocol.VelodromeSlipstreamCL,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pool,
		protocol: Protocol.VelodromeSlipstreamCL,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.VelodromeSlipstreamCLPoolImmutables.set({
		id,
		tickSpacing: event.params.tickSpacing,
	})
}, globalHandlerConfig)

VelodromeCPMMFactory.PoolCreated.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await addTokens0And1AndPoolTokens(
		id,
		event,
		context,
		Protocol.VelodromeCPMM,
	)

	context.Pool.set({
		id,
		chainId: event.chainId,
		address: event.params.pool,
		protocol: Protocol.VelodromeCPMM,
		creatorContract: event.srcAddress,
		createdAt: event.block.timestamp,
		createdAtBlock: event.block.number,
	})

	context.VelodromeCPMMPoolImmutables.set({
		id,
		stable: event.params.stable,
	})
}, globalHandlerConfig)
