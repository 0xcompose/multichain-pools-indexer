import type { ChainMetrics, Token } from "generated"
import type { HandlerContext } from "generated/src/Types"
import { TokenId } from "./tokenId"
import { Protocol } from "./protocols"

const ZERO_CHAIN_METRICS: Omit<ChainMetrics, "id" | "chainId"> = {
	totalPools: 0,
	totalTokens: 0,
}

export async function incrementChainMetricsForPool(
	context: HandlerContext,
	chainId: number,
	protocol: Protocol,
): Promise<void> {
	const chainIdStr = String(chainId)
	let chainMetrics = await context.ChainMetrics.get(chainIdStr)
	if (!chainMetrics) {
		chainMetrics = {
			id: chainIdStr,
			chainId,
			...ZERO_CHAIN_METRICS,
		}
	}
	context.ChainMetrics.set({
		...chainMetrics,
		totalPools: chainMetrics.totalPools + 1,
	})

	const distId = `${chainId}:${protocol}`
	let dist = await context.PoolsProtocolDistributionMetrics.get(distId)
	if (!dist) {
		dist = {
			id: distId,
			chainId,
			protocol,
			poolCount: 0,
		}
	}
	context.PoolsProtocolDistributionMetrics.set({
		...dist,
		poolCount: dist.poolCount + 1,
	})
}

export async function incrementChainMetricsTokenCount(
	context: HandlerContext,
	chainId: number,
	delta: number,
): Promise<void> {
	if (delta <= 0) return
	const id = String(chainId)
	let metrics = await context.ChainMetrics.get(id)
	if (!metrics) {
		metrics = {
			id,
			chainId,
			...ZERO_CHAIN_METRICS,
		}
	}
	context.ChainMetrics.set({
		...metrics,
		totalTokens: metrics.totalTokens + delta,
	})
}

export async function setTokenWithPoolCount(
	context: HandlerContext,
	tokenId: TokenId,
	chainId: number,
	address: string,
	poolCountDelta: number,
): Promise<{ isNew: boolean }> {
	const existing = await context.Token.get(tokenId)
	const prevCount = existing?.poolCount ?? 0
	const isNew = !existing

	const token: Token = {
		id: tokenId,
		chainId,
		address,
		poolCount: prevCount + poolCountDelta,
	}

	context.Token.set(token)

	return { isNew }
}
