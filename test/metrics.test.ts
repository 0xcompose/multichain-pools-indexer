import assert from "assert"
import type {
	ChainMetrics,
	PoolsProtocolDistributionMetrics,
	Token,
} from "generated"
import type { HandlerContext } from "generated/src/Types"
import {
	incrementChainMetricsForPool,
	incrementChainMetricsTokenCount,
	setTokenWithPoolCount,
} from "../src/metrics"
import { Protocol } from "../src/protocols"
import { getTokenId } from "../src/tokenId"

const CHAIN_ID = 42161

function entityMapStore<T extends { id: string }>() {
	const m = new Map<string, T>()
	return {
		get: async (id: string): Promise<T | undefined> => m.get(id),
		set: (e: T): void => {
			m.set(e.id, e)
		},
		all: (): T[] => [...m.values()],
	}
}

/** Minimal HandlerContext for metrics-only unit tests. */
function createMetricsContext(): {
	context: HandlerContext
	chainMetrics: ReturnType<typeof entityMapStore<ChainMetrics>>
	distribution: ReturnType<
		typeof entityMapStore<PoolsProtocolDistributionMetrics>
	>
	tokens: ReturnType<typeof entityMapStore<Token>>
} {
	const chainMetrics = entityMapStore<ChainMetrics>()
	const distribution = entityMapStore<PoolsProtocolDistributionMetrics>()
	const tokens = entityMapStore<Token>()

	const context = {
		ChainMetrics: {
			get: chainMetrics.get,
			set: chainMetrics.set,
		},
		PoolsProtocolDistributionMetrics: {
			get: distribution.get,
			set: distribution.set,
		},
		Token: {
			get: tokens.get,
			set: tokens.set,
		},
	} as unknown as HandlerContext

	return { context, chainMetrics, distribution, tokens }
}

describe("metrics", () => {
	describe("incrementChainMetricsForPool", () => {
		it("creates ChainMetrics and protocol distribution on first pool", async () => {
			const { context, chainMetrics, distribution } = createMetricsContext()

			await incrementChainMetricsForPool(
				context,
				CHAIN_ID,
				Protocol.UniswapV3,
			)

			const cm = await chainMetrics.get(String(CHAIN_ID))
			assert.deepStrictEqual(cm, {
				id: String(CHAIN_ID),
				chainId: CHAIN_ID,
				totalPools: 1,
				totalTokens: 0,
			})

			const distId = `${CHAIN_ID}:${Protocol.UniswapV3}`
			const dist = await distribution.get(distId)
			assert.deepStrictEqual(dist, {
				id: distId,
				chainId: CHAIN_ID,
				protocol: Protocol.UniswapV3,
				poolCount: 1,
			})
		})

		it("increments totals for repeated pools on same chain", async () => {
			const { context, chainMetrics, distribution } = createMetricsContext()

			await incrementChainMetricsForPool(
				context,
				CHAIN_ID,
				Protocol.UniswapV2,
			)
			await incrementChainMetricsForPool(
				context,
				CHAIN_ID,
				Protocol.UniswapV2,
			)

			const cm = await chainMetrics.get(String(CHAIN_ID))
			assert.strictEqual(cm?.totalPools, 2)

			const distId = `${CHAIN_ID}:${Protocol.UniswapV2}`
			const dist = await distribution.get(distId)
			assert.strictEqual(dist?.poolCount, 2)
		})

		it("tracks separate distribution rows per protocol", async () => {
			const { context, chainMetrics, distribution } = createMetricsContext()

			await incrementChainMetricsForPool(
				context,
				CHAIN_ID,
				Protocol.UniswapV3,
			)
			await incrementChainMetricsForPool(
				context,
				CHAIN_ID,
				Protocol.BalancerV2,
			)

			const cm = await chainMetrics.get(String(CHAIN_ID))
			assert.strictEqual(cm?.totalPools, 2)

			const d0 = await distribution.get(`${CHAIN_ID}:${Protocol.UniswapV3}`)
			const d1 = await distribution.get(`${CHAIN_ID}:${Protocol.BalancerV2}`)
			assert.strictEqual(d0?.poolCount, 1)
			assert.strictEqual(d1?.poolCount, 1)
			assert.strictEqual(distribution.all().length, 2)
		})
	})

	describe("incrementChainMetricsTokenCount", () => {
		it("no-ops when delta <= 0", async () => {
			const { context, chainMetrics } = createMetricsContext()

			await incrementChainMetricsTokenCount(context, CHAIN_ID, 0)
			await incrementChainMetricsTokenCount(context, CHAIN_ID, -3)

			const cm = await chainMetrics.get(String(CHAIN_ID))
			assert.strictEqual(cm, undefined)
		})

		it("creates ChainMetrics with totalTokens only", async () => {
			const { context, chainMetrics } = createMetricsContext()

			await incrementChainMetricsTokenCount(context, CHAIN_ID, 2)

			const cm = await chainMetrics.get(String(CHAIN_ID))
			assert.deepStrictEqual(cm, {
				id: String(CHAIN_ID),
				chainId: CHAIN_ID,
				totalPools: 0,
				totalTokens: 2,
			})
		})

		it("preserves totalPools when adding tokens", async () => {
			const { context, chainMetrics } = createMetricsContext()

			await incrementChainMetricsForPool(
				context,
				CHAIN_ID,
				Protocol.UniswapV2,
			)
			await incrementChainMetricsTokenCount(context, CHAIN_ID, 1)

			const cm = await chainMetrics.get(String(CHAIN_ID))
			assert.strictEqual(cm?.totalPools, 1)
			assert.strictEqual(cm?.totalTokens, 1)
		})
	})

	describe("setTokenWithPoolCount", () => {
		it("creates a new Token and reports isNew", async () => {
			const { context, tokens } = createMetricsContext()
			const addr = "0x0000000000000000000000000000000000000001"
			const tid = getTokenId(CHAIN_ID, addr)

			const r = await setTokenWithPoolCount(
				context,
				tid,
				CHAIN_ID,
				addr,
				1,
			)
			assert.strictEqual(r.isNew, true)

			const t = await tokens.get(tid)
			assert.deepStrictEqual(t, {
				id: tid,
				chainId: CHAIN_ID,
				address: addr,
				poolCount: 1,
			})
		})

		it("increments poolCount and reports isNew false for existing token", async () => {
			const { context, tokens } = createMetricsContext()
			const addr = "0x0000000000000000000000000000000000000002"
			const tid = getTokenId(CHAIN_ID, addr)

			await setTokenWithPoolCount(context, tid, CHAIN_ID, addr, 1)
			const r = await setTokenWithPoolCount(
				context,
				tid,
				CHAIN_ID,
				addr,
				3,
			)

			assert.strictEqual(r.isNew, false)
			const t = await tokens.get(tid)
			assert.strictEqual(t?.poolCount, 4)
		})
	})
})
