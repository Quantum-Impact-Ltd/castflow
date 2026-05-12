import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { ContractService } from '../../src/services/ContractService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import { createBookingScenario } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { r2Mock, r2MockState, resetR2Mock } from '../helpers/r2-mock'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
beforeEach(() => {
  resetStripeMockCalls()
  resetStripeMockState()
  resetR2Mock()
  r2Mock.send.mockClear()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

describe('ContractService.generateForBooking', () => {
  it(
    'creates a pending_signatures contract with payment terms derived from the booking',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        totalAmount: 800,
        artistPayoutsEnabled: true,
      })

      const contract = await ContractService.generateForBooking(
        { id: casterUser.id, role: 'caster' },
        booking.id
      )

      expect(contract.status).toBe('pending_signatures')
      expect(contract.bookingId).toBe(booking.id)
      expect(Number(contract.totalAmount)).toBe(800)
      expect(contract.paymentTerms).toContain('£800')
      expect(contract.artistSigned).toBe(false)
      expect(contract.casterSigned).toBe(false)
    },
    TEST_TIMEOUT
  )

  it(
    'is idempotent — re-generating returns the existing contract row',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
      })
      const first = await ContractService.generateForBooking(
        { id: casterUser.id, role: 'caster' },
        booking.id
      )
      const second = await ContractService.generateForBooking(
        { id: casterUser.id, role: 'caster' },
        booking.id
      )
      expect(second.id).toBe(first.id)
      // Only one Contract row exists.
      const count = await prisma.contract.count({ where: { bookingId: booking.id } })
      expect(count).toBe(1)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects non-party callers with FORBIDDEN',
    async () => {
      const { booking } = await createBookingScenario({ artistPayoutsEnabled: true })
      const outsider = await createBookingScenario({ artistPayoutsEnabled: true })

      let caught: unknown
      try {
        await ContractService.generateForBooking(
          { id: outsider.casterUser.id, role: 'caster' },
          booking.id
        )
      } catch (err) {
        caught = err
      }
      // The outsider's caster user won't match the original booking's caster.
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )
})

describe('ContractService.sign', () => {
  it(
    'first signature flips status to partially_signed, records timestamp + name',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        contractStatus: 'pending_signatures',
      })

      const signed = await ContractService.sign(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'Caster Cathy'
      )
      expect(signed.status).toBe('partially_signed')
      expect(signed.casterSigned).toBe(true)
      expect(signed.artistSigned).toBe(false)
      expect(signed.casterSignatureStr).toBe('Caster Cathy')
    },
    TEST_TIMEOUT
  )

  it(
    'second signature flips status to fully_signed and triggers PDF render to R2',
    async () => {
      const { booking, casterUser, artistUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        contractStatus: 'pending_signatures',
      })

      await ContractService.sign(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'Caster Cathy'
      )
      const signed = await ContractService.sign(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'Artist Alice'
      )
      expect(signed.status).toBe('fully_signed')
      expect(signed.artistSigned).toBe(true)

      // PDF render is fire-and-forget — poll for the R2 PutObjectCommand.
      let putCall: { command: string; input: unknown } | undefined
      for (let i = 0; i < 30; i++) {
        putCall = r2MockState.calls.find((c) => c.command === 'PutObjectCommand')
        if (putCall) break
        await new Promise((r) => setTimeout(r, 100))
      }
      expect(putCall).toBeDefined()
      const input = putCall?.input as { Bucket: string; Key: string; ContentType: string }
      expect(input.Bucket).toBe('castflow-contracts')
      expect(input.Key).toContain(`contracts/${booking.id}/`)
      expect(input.ContentType).toBe('application/pdf')

      // The pdfUrl is persisted on the contract row.
      let freshContract: { pdfUrl: string | null } | null = null
      for (let i = 0; i < 30; i++) {
        freshContract = await prisma.contract.findUnique({
          where: { bookingId: booking.id },
          select: { pdfUrl: true },
        })
        if (freshContract?.pdfUrl) break
        await new Promise((r) => setTimeout(r, 100))
      }
      expect(freshContract?.pdfUrl).toMatch(/^s3:\/\/castflow-contracts\/contracts\//)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects signing the same side twice (CONTRACT_ALREADY_SIGNED)',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        contractStatus: 'pending_signatures',
      })
      await ContractService.sign(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'Caster Cathy'
      )

      let caught: unknown
      try {
        await ContractService.sign(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          'Caster Cathy Again'
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('CONTRACT_ALREADY_SIGNED')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects signing beyond the 72h window with INVALID_STATE',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        contractStatus: 'pending_signatures',
      })
      // Backdate the contract's createdAt to 73h ago.
      await prisma.$executeRawUnsafe(
        `UPDATE contracts SET created_at = NOW() - INTERVAL '73 hours' WHERE booking_id = $1`,
        booking.id
      )

      let caught: unknown
      try {
        await ContractService.sign(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          'too late'
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects empty / short signature names with VALIDATION_ERROR',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        contractStatus: 'pending_signatures',
      })

      let caught: unknown
      try {
        await ContractService.sign({ id: casterUser.id, role: 'caster' }, booking.id, 'A')
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('VALIDATION_ERROR')
    },
    TEST_TIMEOUT
  )
})
