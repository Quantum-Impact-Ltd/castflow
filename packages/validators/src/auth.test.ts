import { describe, expect, it } from 'bun:test'
import {
  registerArtistSchema,
  registerCasterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth'

const validArtist = {
  email: 'jane@example.com',
  password: 'Strong1!',
  firstName: 'Jane',
  lastName: 'Doe',
  artistType: 'model' as const,
}

const validCaster = {
  email: 'ops@acme.co',
  password: 'Strong1!',
  companyName: 'Acme',
  companyType: 'brand' as const,
  contactName: 'Pat',
}

describe('registerArtistSchema', () => {
  it('V1: rejects invalid email', () => {
    const result = registerArtistSchema.safeParse({ ...validArtist, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined()
    }
  })

  it('V2: rejects password without digit', () => {
    const result = registerArtistSchema.safeParse({ ...validArtist, password: 'NoDigits!' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })

  it('V3: rejects password without special char', () => {
    const result = registerArtistSchema.safeParse({ ...validArtist, password: 'NoSpecial1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })

  it('V4: rejects password < 8 chars', () => {
    const result = registerArtistSchema.safeParse({ ...validArtist, password: 'A1!' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })

  it('V5: rejects artistType outside enum', () => {
    const result = registerArtistSchema.safeParse({
      ...validArtist,
      artistType: 'voiceover' as unknown as 'model',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.artistType).toBeDefined()
    }
  })

  it('V6: trims firstName/lastName whitespace', () => {
    const result = registerArtistSchema.safeParse({
      ...validArtist,
      firstName: '  Jane  ',
      lastName: '  Doe  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.firstName).toBe('Jane')
      expect(result.data.lastName).toBe('Doe')
    }
  })

  it('V7: accepts valid input', () => {
    const result = registerArtistSchema.safeParse(validArtist)
    expect(result.success).toBe(true)
  })
})

describe('registerCasterSchema', () => {
  it('V8: rejects companyType outside enum', () => {
    const result = registerCasterSchema.safeParse({
      ...validCaster,
      companyType: 'startup' as unknown as 'brand',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.companyType).toBeDefined()
    }
  })

  it('V9: accepts each valid companyType', () => {
    const types = ['brand', 'agency', 'production_house', 'independent'] as const
    for (const companyType of types) {
      const result = registerCasterSchema.safeParse({ ...validCaster, companyType })
      expect(result.success).toBe(true)
    }
  })
})

describe('loginSchema', () => {
  it('V10: rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'jane@example.com', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })
})

describe('resetPasswordSchema', () => {
  it('V11: rejects weak password', () => {
    const result = resetPasswordSchema.safeParse({ token: 'tok', password: 'weak' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toBeDefined()
    }
  })

  it('V12: rejects missing token', () => {
    const result = resetPasswordSchema.safeParse({ token: '', password: 'Strong1!' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.token).toBeDefined()
    }
  })
})

describe('forgotPasswordSchema', () => {
  it('V13: rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'nope' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined()
    }
  })
})
