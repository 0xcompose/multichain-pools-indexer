import assert from "assert"
import { TestHelpers, Pool } from "generated"
import { Protocol } from "../src/protocols"
const { MockDb, AlgebraIntegral } = TestHelpers

describe("AlgebraIntegral contract CustomPool event tests", () => {
	// Create mock db
	const mockDb = MockDb.createMockDb()

	// Creating mock for AlgebraIntegral contract CustomPool event
	const event = AlgebraIntegral.CustomPool.createMockEvent({
		/* It mocks event fields with default values. You can overwrite them if you need */
	})

	it("AlgebraIntegral_CustomPool is created correctly", async () => {
		// Processing the event
		const mockDbUpdated = await AlgebraIntegral.CustomPool.processEvent({
			event,
			mockDb,
		})

		// Getting the actual entity from the mock database
		let actualPool = mockDbUpdated.entities.Pool.get(
			`${event.chainId}:${event.params.pool}`,
		)

		// Creating the expected entity
		const expectedPool: Pool = {
			id: `${event.chainId}:${event.params.pool}`,
			chainId: event.chainId,
			address: event.params.pool,
			protocol: Protocol.AlgebraIntegral,
			creatorContract: event.srcAddress,
			createdAt: event.block.timestamp,
			createdAtBlock: event.block.number,
		}
		// Asserting that the entity in the mock database is the same as the expected entity
		assert.deepEqual(
			actualPool,
			expectedPool,
			"Actual Pool should be the same as the expected Pool",
		)
	})
})
