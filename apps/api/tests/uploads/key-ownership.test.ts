import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { UploadService } from '../../src/services/UploadService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import { createTestArtist } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

describe('UploadService.confirmUpload — key ownership', () => {
  it(
    'accepts a key that matches `${type}/${userId}/`',
    async () => {
      const { user, artist } = await createTestArtist()
      const key = `portfolio_photo/${user.id}/${crypto.randomUUID()}.jpg`
      const result = await UploadService.confirmUpload(user.id, {
        type: 'portfolio_photo',
        key,
        url: `https://r2.test/${key}`,
      })
      expect(result.kind).toBe('portfolio_item')

      const items = await prisma.portfolioItem.findMany({
        where: { artistProfileId: artist.id },
      })
      expect(items.length).toBe(1)
      expect(items[0]?.url).toBe(`https://r2.test/${key}`)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a key for a different user with FORBIDDEN',
    async () => {
      const { user: userA } = await createTestArtist()
      const { user: userB } = await createTestArtist()

      const otherUserKey = `portfolio_photo/${userB.id}/${crypto.randomUUID()}.jpg`
      let caught: unknown
      try {
        await UploadService.confirmUpload(userA.id, {
          type: 'portfolio_photo',
          key: otherUserKey,
          url: `https://r2.test/${otherUserKey}`,
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
      expect((caught as AppError).statusCode).toBe(403)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a key with the wrong type prefix (e.g. id_document key submitted as portfolio_photo)',
    async () => {
      const { user } = await createTestArtist()
      const wrongTypeKey = `id_document/${user.id}/${crypto.randomUUID()}.jpg`

      let caught: unknown
      try {
        await UploadService.confirmUpload(user.id, {
          type: 'portfolio_photo',
          key: wrongTypeKey,
          url: `https://r2.test/${wrongTypeKey}`,
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a key with no prefix at all (absolute-path injection)',
    async () => {
      const { user } = await createTestArtist()
      let caught: unknown
      try {
        await UploadService.confirmUpload(user.id, {
          type: 'portfolio_photo',
          key: 'bogus-flat-filename.jpg',
          url: 'https://r2.test/bogus-flat-filename.jpg',
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a key that uses the right user prefix but the wrong type folder',
    async () => {
      const { user } = await createTestArtist()
      // Type-prefix mismatch — even with the right userId, the type folder must match.
      const key = `portfolio_video/${user.id}/${crypto.randomUUID()}.jpg`

      let caught: unknown
      try {
        await UploadService.confirmUpload(user.id, {
          type: 'portfolio_photo',
          key,
          url: `https://r2.test/${key}`,
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'id_document with valid key prefix updates the artist profile',
    async () => {
      const { user, artist } = await createTestArtist()
      const key = `id_document/${user.id}/${crypto.randomUUID()}.jpg`

      const result = await UploadService.confirmUpload(user.id, {
        type: 'id_document',
        key,
        url: `https://r2.test/${key}`,
      })
      expect(result.kind).toBe('id_document')

      const fresh = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(fresh?.idDocumentUrl).toBe(key)
      // idVerified flips back to false on a fresh upload (admin must re-verify).
      expect(fresh?.idVerified).toBe(false)
    },
    TEST_TIMEOUT
  )
})
