import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { UploadService } from '../../src/services/UploadService'
import { ContractService } from '../../src/services/ContractService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import {
  createTestArtist,
  createBookingScenario,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

// Create a portfolio item directly for the given artist profile.
async function makePortfolioItem(
  artistProfileId: string,
  opts: { isPrimary?: boolean; displayOrder?: number } = {}
) {
  return prisma.portfolioItem.create({
    data: {
      artistProfileId,
      type: 'photo',
      entryType: 'other',
      url: `https://pub.test/portfolio_photo/${crypto.randomUUID()}.jpg`,
      links: [],
      displayOrder: opts.displayOrder ?? 0,
      isPrimary: opts.isPrimary ?? false,
      isApproved: false,
    },
  })
}

describe('UploadService.getPresignedUrl', () => {
  it(
    'rejects an unsupported content type',
    async () => {
      const { user } = await createTestArtist()
      await expect(
        UploadService.getPresignedUrl(user.id, {
          type: 'portfolio_photo',
          contentType: 'application/x-msdownload',
          size: 1024,
        })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 })
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a file over the size limit',
    async () => {
      const { user } = await createTestArtist()
      await expect(
        UploadService.getPresignedUrl(user.id, {
          type: 'portfolio_photo',
          contentType: 'image/jpeg',
          size: 9_999_999_999,
        })
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 })
    },
    TEST_TIMEOUT
  )

  it(
    'returns a presigned PUT for a public portfolio upload (user-scoped key + public URL)',
    async () => {
      const { user } = await createTestArtist()
      const res = await UploadService.getPresignedUrl(user.id, {
        type: 'portfolio_photo',
        contentType: 'image/jpeg',
        size: 1024,
      })
      expect(res.uploadUrl).toContain('signed.mock')
      expect(res.visibility).toBe('public')
      expect(res.key.startsWith(`portfolio_photo/${user.id}/`)).toBe(true)
      expect(res.publicUrl).not.toBeNull()
      expect(res.publicUrl).toContain(res.key)
      expect(res.expiresIn).toBeGreaterThan(0)
    },
    TEST_TIMEOUT
  )

  it(
    'routes ID documents to the private bucket with no public URL',
    async () => {
      const { user } = await createTestArtist()
      const res = await UploadService.getPresignedUrl(user.id, {
        type: 'id_document',
        contentType: 'image/jpeg',
        size: 1024,
      })
      expect(res.visibility).toBe('private')
      expect(res.publicUrl).toBeNull()
      expect(res.key.startsWith(`id_document/${user.id}/`)).toBe(true)
    },
    TEST_TIMEOUT
  )
})

describe('UploadService.deletePortfolioItem', () => {
  it(
    'rejects deleting an item the user does not own',
    async () => {
      const { artist } = await createTestArtist()
      const { user: other } = await createTestArtist()
      const item = await makePortfolioItem(artist.id)
      await expect(UploadService.deletePortfolioItem(other.id, item.id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        statusCode: 403,
      })
    },
    TEST_TIMEOUT
  )

  it(
    'deletes the item and promotes the next one to primary',
    async () => {
      const { user, artist } = await createTestArtist()
      const primary = await makePortfolioItem(artist.id, { isPrimary: true, displayOrder: 0 })
      const next = await makePortfolioItem(artist.id, { isPrimary: false, displayOrder: 1 })

      await UploadService.deletePortfolioItem(user.id, primary.id)

      const remaining = await prisma.portfolioItem.findMany({
        where: { artistProfileId: artist.id },
      })
      expect(remaining).toHaveLength(1)
      expect(remaining[0]?.id).toBe(next.id)
      expect(remaining[0]?.isPrimary).toBe(true)
    },
    TEST_TIMEOUT
  )
})

describe('UploadService.updatePortfolioItem', () => {
  it(
    'rejects editing an item the user does not own',
    async () => {
      const { artist } = await createTestArtist()
      const { user: other } = await createTestArtist()
      const item = await makePortfolioItem(artist.id)
      await expect(
        UploadService.updatePortfolioItem(other.id, item.id, { title: 'hijack' })
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })
    },
    TEST_TIMEOUT
  )

  it(
    'updates metadata for the owning artist',
    async () => {
      const { user, artist } = await createTestArtist()
      const item = await makePortfolioItem(artist.id)
      const updated = await UploadService.updatePortfolioItem(user.id, item.id, {
        title: 'Vogue editorial',
        entryType: 'editorial',
      })
      expect(updated.title).toBe('Vogue editorial')
      expect(updated.entryType).toBe('editorial')
    },
    TEST_TIMEOUT
  )
})

describe('UploadService.setPrimaryPortfolioItem', () => {
  it(
    'rejects a non-owner',
    async () => {
      const { artist } = await createTestArtist()
      const { user: other } = await createTestArtist()
      const item = await makePortfolioItem(artist.id)
      await expect(UploadService.setPrimaryPortfolioItem(other.id, item.id)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    },
    TEST_TIMEOUT
  )

  it(
    'makes the chosen item primary and clears the previous primary',
    async () => {
      const { user, artist } = await createTestArtist()
      const old = await makePortfolioItem(artist.id, { isPrimary: true, displayOrder: 0 })
      const target = await makePortfolioItem(artist.id, { isPrimary: false, displayOrder: 1 })

      await UploadService.setPrimaryPortfolioItem(user.id, target.id)

      const rows = await prisma.portfolioItem.findMany({ where: { artistProfileId: artist.id } })
      const byId = Object.fromEntries(rows.map((r) => [r.id, r.isPrimary]))
      expect(byId[target.id]).toBe(true)
      expect(byId[old.id]).toBe(false)
    },
    TEST_TIMEOUT
  )
})

describe('UploadService ID-document presigned reads', () => {
  it(
    'returns null when the artist has no ID document',
    async () => {
      const { user, artist } = await createTestArtist()
      expect(await UploadService.getMyIdDocumentUrl(user.id)).toBeNull()
      expect(await UploadService.getIdDocumentUrlByProfileId(artist.id)).toBeNull()
    },
    TEST_TIMEOUT
  )

  it(
    'returns a presigned read URL + content-type hint when a doc exists (self + admin paths)',
    async () => {
      const { user, artist } = await createTestArtist()
      const key = `id_document/${user.id}/${crypto.randomUUID()}.pdf`
      await prisma.artistProfile.update({ where: { id: artist.id }, data: { idDocumentUrl: key } })

      const self = await UploadService.getMyIdDocumentUrl(user.id)
      expect(self?.url).toContain('signed.mock')
      expect(self?.url).toContain(key)
      expect(self?.contentTypeHint).toBe('pdf')

      const admin = await UploadService.getIdDocumentUrlByProfileId(artist.id)
      expect(admin?.url).toContain(key)
      expect(admin?.contentTypeHint).toBe('pdf')
    },
    TEST_TIMEOUT
  )
})

describe('ContractService.getPdfDownloadUrl', () => {
  it(
    'returns a presigned URL targeting the contracts bucket for a booking party',
    async () => {
      const { casterUser, booking } = await createBookingScenario({ contractStatus: 'fully_signed' })
      const key = `contracts/${booking.id}/contract.pdf`
      await prisma.contract.update({
        where: { bookingId: booking.id },
        data: { pdfUrl: `s3://castflow-contracts/${key}` },
      })

      const res = await ContractService.getPdfDownloadUrl(
        { id: casterUser.id, role: 'caster' },
        booking.id
      )
      expect(res.url).toContain('castflow-contracts')
      expect(res.url).toContain(key)
      expect(res.expiresIn).toBeGreaterThan(0)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a user who is not a party to the booking',
    async () => {
      const { booking } = await createBookingScenario({ contractStatus: 'fully_signed' })
      await prisma.contract.update({
        where: { bookingId: booking.id },
        data: { pdfUrl: `s3://castflow-contracts/contracts/${booking.id}/contract.pdf` },
      })
      const { user: outsider } = await createTestArtist()
      await expect(
        ContractService.getPdfDownloadUrl({ id: outsider.id, role: 'artist' }, booking.id)
      ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 })
    },
    TEST_TIMEOUT
  )

  it(
    'returns NOT_FOUND when the contract has no PDF yet',
    async () => {
      const { casterUser, booking } = await createBookingScenario({
        contractStatus: 'pending_signatures',
      })
      await expect(
        ContractService.getPdfDownloadUrl({ id: casterUser.id, role: 'caster' }, booking.id)
      ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 })
    },
    TEST_TIMEOUT
  )
})
