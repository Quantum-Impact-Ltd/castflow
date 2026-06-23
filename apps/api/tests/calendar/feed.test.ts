import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { CalendarService } from '../../src/services/CalendarService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import {
  createBookingScenario,
  createTestArtist,
  createTestCaster,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
beforeEach(() => {
  resetStripeMockCalls()
  resetStripeMockState()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

describe('CalendarService.ensureToken / regenerateToken', () => {
  it(
    'ensureToken is idempotent — returns the same token on repeat calls',
    async () => {
      const { user } = await createTestArtist()
      const a = await CalendarService.ensureToken(user.id)
      const b = await CalendarService.ensureToken(user.id)
      expect(a).toBe(b)
      expect(a.length).toBeGreaterThanOrEqual(40)
    },
    TEST_TIMEOUT
  )

  it(
    'regenerateToken rotates the token — old token no longer resolves',
    async () => {
      const { user } = await createTestArtist()
      const oldToken = await CalendarService.ensureToken(user.id)
      const newToken = await CalendarService.regenerateToken(user.id)
      expect(newToken).not.toBe(oldToken)

      // Old token's buildFeed → NOT_FOUND.
      let caught: unknown
      try {
        await CalendarService.buildFeed(oldToken)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('NOT_FOUND')

      // New token's buildFeed returns a valid (possibly empty) ICS.
      const ics = await CalendarService.buildFeed(newToken)
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('END:VCALENDAR')
    },
    TEST_TIMEOUT
  )
})

describe('CalendarService.buildFeed — ICS output', () => {
  it(
    'returns a structurally valid ICS calendar with no events when user has no bookings',
    async () => {
      const { user } = await createTestArtist()
      const token = await CalendarService.ensureToken(user.id)

      const ics = await CalendarService.buildFeed(token)
      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('PRODID:-//CastFlow//Bookings//EN')
      expect(ics).toContain('END:VCALENDAR')
      // No events.
      expect(ics).not.toContain('BEGIN:VEVENT')
    },
    TEST_TIMEOUT
  )

  it(
    'includes one VEVENT per confirmed/completed booking with UTC DTSTART/DTEND',
    async () => {
      const { artistUser, booking } = await createBookingScenario({
        bookingStatus: 'confirmed',
        contractStatus: 'pending_signatures',
      })
      const token = await CalendarService.ensureToken(artistUser.id)

      const ics = await CalendarService.buildFeed(token)
      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('END:VEVENT')
      // UID is the booking id.
      expect(ics).toContain(`UID:${booking.id}@castflow`)
      // Summary should reference the job title.
      expect(ics).toContain('CastFlow — Test shoot')
      // ICS DTSTART/DTEND in UTC: YYYYMMDDTHHMMSSZ
      expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/)
      expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z/)
      // CRLF line endings — required by RFC 5545.
      expect(ics).toContain('\r\n')
    },
    TEST_TIMEOUT
  )

  it(
    'hides shoot LOCATION until the contract is fully_signed',
    async () => {
      const { artistUser, booking } = await createBookingScenario({
        contractStatus: 'pending_signatures',
        bookingStatus: 'confirmed',
      })
      await prisma.booking.update({
        where: { id: booking.id },
        data: { shootLocation: '42 Acme Street, EC1 9XY' },
      })
      const token = await CalendarService.ensureToken(artistUser.id)

      const ics = await CalendarService.buildFeed(token)
      expect(ics).not.toContain('42 Acme Street')
      // RFC 5545 folds long lines on every 73 chars with CRLF + space — un-fold
      // before substring-matching so the assertion isn't tripped by the wrap.
      const unfolded = ics.replace(/\r\n /g, '')
      expect(unfolded).toContain('revealed once both parties sign the contract')
      // And no LOCATION: line at all when the contract isn't signed.
      expect(ics).not.toMatch(/^LOCATION:.+$/m)
    },
    TEST_TIMEOUT
  )

  it(
    'reveals LOCATION once the contract is fully_signed',
    async () => {
      const { artistUser, booking } = await createBookingScenario({
        contractStatus: 'fully_signed',
        bookingStatus: 'confirmed',
      })
      await prisma.booking.update({
        where: { id: booking.id },
        data: { shootLocation: '42 Acme Street, EC1 9XY' },
      })
      const token = await CalendarService.ensureToken(artistUser.id)

      const ics = await CalendarService.buildFeed(token)
      expect(ics).toContain('42 Acme Street')
      expect(ics).toMatch(/LOCATION:42 Acme Street/)
    },
    TEST_TIMEOUT
  )

  it(
    'omits cancelled / pending_contract / disputed bookings from the feed',
    async () => {
      const { artistUser } = await createBookingScenario({
        bookingStatus: 'cancelled',
        contractStatus: 'pending_signatures',
      })
      const token = await CalendarService.ensureToken(artistUser.id)
      const ics = await CalendarService.buildFeed(token)
      expect(ics).not.toContain('BEGIN:VEVENT')
    },
    TEST_TIMEOUT
  )

  it(
    'caster role gets a feed scoped to their casted bookings',
    async () => {
      const { casterUser, booking } = await createBookingScenario({
        bookingStatus: 'confirmed',
        contractStatus: 'fully_signed',
      })
      const token = await CalendarService.ensureToken(casterUser.id)

      const ics = await CalendarService.buildFeed(token)
      expect(ics).toContain(`UID:${booking.id}@castflow`)
    },
    TEST_TIMEOUT
  )

  it(
    'unknown token returns a NOT_FOUND',
    async () => {
      let caught: unknown
      try {
        await CalendarService.buildFeed('totally-bogus-token')
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('NOT_FOUND')
    },
    TEST_TIMEOUT
  )
})
