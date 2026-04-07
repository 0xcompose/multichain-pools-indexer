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
import { globalHandlerConfig } from "./handlerConfig"
import { Protocol } from "./protocols"
import { getPoolId } from "./poolId"
import { addTwoAssetPoolTokensAndMetrics } from "./twoAssetPoolTokens"

AlgebraIntegral.CustomPool.handler(async ({ event, context }) => {
	const id = getPoolId(event.chainId, event.params.pool)

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.token0,
		event.params.token1,
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

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.token0,
		event.params.token1,
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

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.token0,
		event.params.token1,
		Protocol.UniswapV2,
	)

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

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.token0,
		event.params.token1,
		Protocol.UniswapV3,
	)

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

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.token0,
		event.params.token1,
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

	await addTwoAssetPoolTokensAndMetrics(
		context,
		event.chainId,
		id,
		event.params.token0,
		event.params.token1,
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
