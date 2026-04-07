import assert from "assert"
import {
	TestHelpers,
	type AlgebraIntegralPoolImmutables,
	type BalancerV2PoolImmutables,
	type BalancerV3PoolImmutables,
	type PancakeSwapInfinityPoolImmutables,
	type Pool,
	type PoolToken,
	type Token,
	type UniswapV3PoolImmutables,
	type UniswapV4PoolImmutables,
	type VelodromeCPMMPoolImmutables,
	type VelodromeSlipstreamCLPoolImmutables,
} from "generated"
import { Protocol } from "../src/protocols"
import { getPoolId, getPoolTokenId, type PoolId } from "../src/poolId"
import { getTokenId } from "../src/tokenId"

const CHAIN_ID = 42161
const BLOCK = { number: 12_345_678, timestamp: 1_701_234_567 } as const

const {
	MockDb,
	AlgebraIntegral,
	UniswapV2Factory,
	UniswapV3Factory,
	VelodromeSlipstreamCLFactory,
	VelodromeCPMMFactory,
	BalancerV2Vault,
	BalancerV3Vault,
	PoolManager,
	CLPoolManager,
	Addresses,
} = TestHelpers

const ADDR = Addresses.mockAddresses
assert.ok(ADDR.length >= 12, "expected >= 12 Addresses.mockAddresses")

const mockEventData = {
	chainId: CHAIN_ID,
	block: { ...BLOCK },
} as const

function expectTokens(
	db: ReturnType<typeof MockDb.createMockDb>,
	chainId: number,
	addresses: [string, string],
): { t0: Token; t1: Token } {
	const [a0, a1] = addresses
	const id0 = getTokenId(chainId, a0)
	const id1 = getTokenId(chainId, a1)
	const t0 = db.entities.Token.get(id0)
	const t1 = db.entities.Token.get(id1)
	assert.ok(t0, `Token ${id0}`)
	assert.ok(t1, `Token ${id1}`)
	return { t0, t1 }
}

function expectPairPoolTokens(
	db: ReturnType<typeof MockDb.createMockDb>,
	poolId: PoolId,
	tokenAddrs: [string, string],
): { pt0: PoolToken; pt1: PoolToken } {
	const [a0, a1] = tokenAddrs
	const tid0 = getTokenId(CHAIN_ID, a0)
	const tid1 = getTokenId(CHAIN_ID, a1)
	const pt0 = db.entities.PoolToken.get(getPoolTokenId(poolId, 0))
	const pt1 = db.entities.PoolToken.get(getPoolTokenId(poolId, 1))
	const exp0: PoolToken = {
		id: getPoolTokenId(poolId, 0),
		pool_id: poolId,
		token_id: tid0,
		tokenIndex: 0,
	}
	const exp1: PoolToken = {
		id: getPoolTokenId(poolId, 1),
		pool_id: poolId,
		token_id: tid1,
		tokenIndex: 1,
	}
	assert.deepStrictEqual(pt0, exp0)
	assert.deepStrictEqual(pt1, exp1)
	return { pt0, pt1 }
}

describe("Pool creation by protocol", () => {
	it("AlgebraIntegral CustomPool creates Pool, PoolTokens, Tokens, immutables", async () => {
		const token0 = ADDR[0]!
		const token1 = ADDR[1]!
		const pool = ADDR[2]!
		const deployer = ADDR[3]!
		const factory = ADDR[4]!

		const mockDb = MockDb.createMockDb()
		const event = AlgebraIntegral.CustomPool.createMockEvent({
			token0,
			token1,
			pool,
			deployer,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await AlgebraIntegral.CustomPool.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, pool)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pool,
			protocol: Protocol.AlgebraIntegral,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)

		const { t0, t1 } = expectTokens(db, CHAIN_ID, [token0, token1])
		assert.strictEqual(t0.poolCount, 1)
		assert.strictEqual(t1.poolCount, 1)
		expectPairPoolTokens(db, poolId, [token0, token1])

		const imm = db.entities.AlgebraIntegralPoolImmutables.get(poolId)
		const expected: AlgebraIntegralPoolImmutables = {
			id: poolId,
			deployer,
			tickSpacing: undefined,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("AlgebraIntegral Pool creates Pool and immutables (deployer unset)", async () => {
		const token0 = ADDR[0]!
		const token1 = ADDR[1]!
		const pool = ADDR[2]!
		const factory = ADDR[4]!

		const mockDb = MockDb.createMockDb()
		const event = AlgebraIntegral.Pool.createMockEvent({
			token0,
			token1,
			pool,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await AlgebraIntegral.Pool.processEvent({ event, mockDb })

		const poolId = getPoolId(CHAIN_ID, pool)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pool,
			protocol: Protocol.AlgebraIntegral,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [token0, token1])

		const imm = db.entities.AlgebraIntegralPoolImmutables.get(poolId)
		const expected: AlgebraIntegralPoolImmutables = {
			id: poolId,
			deployer: undefined,
			tickSpacing: undefined,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("UniswapV2 PairCreated", async () => {
		const token0 = ADDR[0]!
		const token1 = ADDR[1]!
		const pair = ADDR[5]!
		const factory = ADDR[4]!

		const mockDb = MockDb.createMockDb()
		const event = UniswapV2Factory.PairCreated.createMockEvent({
			token0,
			token1,
			pair,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await UniswapV2Factory.PairCreated.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, pair)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pair,
			protocol: Protocol.UniswapV2,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [token0, token1])
	})

	it("UniswapV3 PoolCreated + immutables", async () => {
		const token0 = ADDR[0]!
		const token1 = ADDR[1]!
		const pool = ADDR[6]!
		const factory = ADDR[4]!
		const fee = 3000n
		const tickSpacing = 60n

		const mockDb = MockDb.createMockDb()
		const event = UniswapV3Factory.PoolCreated.createMockEvent({
			token0,
			token1,
			pool,
			fee,
			tickSpacing,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await UniswapV3Factory.PoolCreated.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, pool)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pool,
			protocol: Protocol.UniswapV3,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [token0, token1])

		const imm = db.entities.UniswapV3PoolImmutables.get(poolId)
		const expected: UniswapV3PoolImmutables = {
			id: poolId,
			fee,
			tickSpacing,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("Velodrome Slipstream CL PoolCreated", async () => {
		const token0 = ADDR[0]!
		const token1 = ADDR[1]!
		const pool = ADDR[7]!
		const factory = ADDR[4]!
		const tickSpacing = 200n

		const mockDb = MockDb.createMockDb()
		const event = VelodromeSlipstreamCLFactory.PoolCreated.createMockEvent({
			token0,
			token1,
			pool,
			tickSpacing,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await VelodromeSlipstreamCLFactory.PoolCreated.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, pool)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pool,
			protocol: Protocol.VelodromeSlipstreamCL,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [token0, token1])

		const imm = db.entities.VelodromeSlipstreamCLPoolImmutables.get(poolId)
		const expected: VelodromeSlipstreamCLPoolImmutables = {
			id: poolId,
			tickSpacing,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("Velodrome CPMM PoolCreated", async () => {
		const token0 = ADDR[0]!
		const token1 = ADDR[1]!
		const pool = ADDR[8]!
		const factory = ADDR[4]!
		const stable = true

		const mockDb = MockDb.createMockDb()
		const event = VelodromeCPMMFactory.PoolCreated.createMockEvent({
			token0,
			token1,
			pool,
			stable,
			_4: 0n,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await VelodromeCPMMFactory.PoolCreated.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, pool)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pool,
			protocol: Protocol.VelodromeCPMM,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [token0, token1])

		const imm = db.entities.VelodromeCPMMPoolImmutables.get(poolId)
		const expected: VelodromeCPMMPoolImmutables = {
			id: poolId,
			stable,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("BalancerV2 PoolRegistered (no PoolToken rows)", async () => {
		const poolAddress = ADDR[9]!
		const factory = ADDR[4]!
		const poolIdHex =
			"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
		const specialization = 1n

		const mockDb = MockDb.createMockDb()
		const event = BalancerV2Vault.PoolRegistered.createMockEvent({
			poolId: poolIdHex,
			poolAddress,
			specialization,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await BalancerV2Vault.PoolRegistered.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, poolIdHex)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: poolAddress,
			protocol: Protocol.BalancerV2,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		assert.strictEqual(db.entities.PoolToken.getAll().length, 0)

		const imm = db.entities.BalancerV2PoolImmutables.get(poolId)
		const expected: BalancerV2PoolImmutables = {
			id: poolId,
			specialization: specialization.toString(),
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("BalancerV3 PoolRegistered with multiple PoolTokens", async () => {
		const pool = ADDR[10]!
		const factory = ADDR[11]!
		const tokenA = ADDR[0]!
		const tokenB = ADDR[1]!
		const zero = ADDR[2]!
		const swapFee = 5_000_000_000_000_000n

		const mockDb = MockDb.createMockDb()
		const event = BalancerV3Vault.PoolRegistered.createMockEvent({
			pool,
			factory,
			tokenConfig: [
				[tokenA, 0n, zero, false],
				[tokenB, 0n, zero, false],
			],
			swapFeePercentage: swapFee,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await BalancerV3Vault.PoolRegistered.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, pool)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: pool,
			protocol: Protocol.BalancerV3,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)

		for (let i = 0; i < 2; i++) {
			const tokenAddr = i === 0 ? tokenA : tokenB
			const tid = getTokenId(CHAIN_ID, tokenAddr)
			const pt = db.entities.PoolToken.get(getPoolTokenId(poolId, i))
			const exp: PoolToken = {
				id: getPoolTokenId(poolId, i),
				pool_id: poolId,
				token_id: tid,
				tokenIndex: i,
			}
			assert.deepStrictEqual(pt, exp)
		}

		const imm = db.entities.BalancerV3PoolImmutables.get(poolId)
		const expected: BalancerV3PoolImmutables = {
			id: poolId,
			factory,
			swapFeePercentage: swapFee,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("UniswapV4 PoolManager Initialize", async () => {
		const currency0 = ADDR[0]!
		const currency1 = ADDR[1]!
		const poolKeyId =
			"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
		const factory = ADDR[4]!
		const fee = 500n
		const tickSpacing = 10n
		const hooks = ADDR[3]!

		const mockDb = MockDb.createMockDb()
		const event = PoolManager.Initialize.createMockEvent({
			id: poolKeyId,
			currency0,
			currency1,
			fee,
			tickSpacing,
			hooks,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await PoolManager.Initialize.processEvent({ event, mockDb })

		const poolId = getPoolId(CHAIN_ID, poolKeyId)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: poolKeyId,
			protocol: Protocol.UniswapV4,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [currency0, currency1])

		const imm = db.entities.UniswapV4PoolImmutables.get(poolId)
		const expected: UniswapV4PoolImmutables = {
			id: poolId,
			fee,
			tickSpacing,
			hooks,
		}
		assert.deepStrictEqual(imm, expected)
	})

	it("PancakeSwap Infinity CLPoolManager Initialize", async () => {
		const currency0 = ADDR[0]!
		const currency1 = ADDR[1]!
		const poolKeyId =
			"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
		const factory = ADDR[4]!
		const fee = 2500n
		const hooks = ADDR[3]!
		const parameters = "0x01"

		const mockDb = MockDb.createMockDb()
		const event = CLPoolManager.Initialize.createMockEvent({
			id: poolKeyId,
			currency0,
			currency1,
			fee,
			hooks,
			parameters,
			mockEventData: { ...mockEventData, srcAddress: factory },
		})
		const db = await CLPoolManager.Initialize.processEvent({
			event,
			mockDb,
		})

		const poolId = getPoolId(CHAIN_ID, poolKeyId)
		const expectedPool: Pool = {
			id: poolId,
			chainId: CHAIN_ID,
			address: poolKeyId,
			protocol: Protocol.PancakeSwapInfinity,
			creatorContract: factory,
			createdAt: BLOCK.timestamp,
			createdAtBlock: BLOCK.number,
		}
		assert.deepStrictEqual(db.entities.Pool.get(poolId), expectedPool)
		expectPairPoolTokens(db, poolId, [currency0, currency1])

		const imm = db.entities.PancakeSwapInfinityPoolImmutables.get(poolId)
		const expected: PancakeSwapInfinityPoolImmutables = {
			id: poolId,
			fee,
			hooks,
			parameters,
		}
		assert.deepStrictEqual(imm, expected)
	})
})
