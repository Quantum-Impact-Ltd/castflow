import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'

/**
 * Per-user ICS calendar feed. The user pastes a one-off subscription URL
 * into Apple/Google/Outlook and their CastFlow shoots auto-sync. One-way:
 * CastFlow → user calendar. Read-only by design (calendar apps don't send
 * cookies; the token in the URL is the only auth).
 *
 * Token compromise mitigation: regenerate from the dashboard — old URL
 * stops working immediately, user re-adds the new one.
 */

function randomToken(length = 40): string {
  // URL-safe base64 of crypto random bytes. Bun exposes Web Crypto.
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, length)
}

/**
 * ICS line folding: lines > 75 octets must be folded with CRLF + space.
 * Simple version — split on raw character count.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  for (let i = 0; i < line.length; i += 73) {
    chunks.push(line.slice(i, i + 73))
  }
  return chunks.join('\r\n ')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function fmtDate(d: Date): string {
  // ICS DATE-TIME in UTC: YYYYMMDDTHHMMSSZ
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

interface BookingForCalendar {
  id: string
  shootDate: Date
  callTime: Date | null
  shootLocation: string
  status: string
  job: { title: string; shootDurationHours: number | { toString: () => string } | null }
  caster: { companyName: string }
  artist: { firstName: string }
  contract: { status: string } | null
}

function eventLines(booking: BookingForCalendar, viewerSide: 'artist' | 'caster'): string[] {
  const contractSigned = booking.contract?.status === 'fully_signed'
  const otherParty = viewerSide === 'artist' ? booking.caster.companyName : booking.artist.firstName
  const summary = `CastFlow — ${booking.job.title}${otherParty ? ` (${otherParty})` : ''}`
  const durationHours = Number(
    typeof booking.job.shootDurationHours === 'number'
      ? booking.job.shootDurationHours
      : (booking.job.shootDurationHours?.toString() ?? '0')
  )
  const start = booking.callTime ?? booking.shootDate
  const end = new Date(start.getTime() + (durationHours || 4) * 60 * 60 * 1000)

  const descParts = [
    `Shoot: ${booking.job.title}`,
    `Status: ${booking.status}`,
    contractSigned
      ? `Location: ${booking.shootLocation}`
      : 'Location: revealed once both parties sign the contract',
  ]
  if (booking.callTime) descParts.push(`Call time: ${booking.callTime.toUTCString()}`)
  const description = escapeText(descParts.join('\n'))

  const location = contractSigned ? escapeText(booking.shootLocation) : ''

  return [
    'BEGIN:VEVENT',
    foldLine(`UID:${booking.id}@castflow`),
    foldLine(`DTSTAMP:${fmtDate(new Date())}`),
    foldLine(`DTSTART:${fmtDate(start)}`),
    foldLine(`DTEND:${fmtDate(end)}`),
    foldLine(`SUMMARY:${escapeText(summary)}`),
    foldLine(`DESCRIPTION:${description}`),
    ...(location ? [foldLine(`LOCATION:${location}`)] : []),
    foldLine(`URL:${env.FRONTEND_URL}/bookings/${booking.id}`),
    'END:VEVENT',
  ]
}

export class CalendarService {
  protected static readonly db = prisma

  /**
   * Idempotently produce a calendar token for the user. If they already have
   * one we keep it (no regeneration unless explicitly requested) so adding
   * the same feed URL twice doesn't break the existing subscription.
   */
  static async ensureToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { calendarToken: true },
    })
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404)
    if (user.calendarToken) return user.calendarToken
    const token = randomToken()
    await prisma.user.update({ where: { id: userId }, data: { calendarToken: token } })
    return token
  }

  static async regenerateToken(userId: string): Promise<string> {
    const token = randomToken()
    await prisma.user.update({ where: { id: userId }, data: { calendarToken: token } })
    return token
  }

  static feedUrl(token: string): string {
    return `${env.BETTER_AUTH_URL.replace(/\/$/, '')}/api/v1/calendar/feed/${token}.ics`
  }

  /**
   * Build the ICS payload for the holder of `token`. Returns the raw
   * `text/calendar` string. Caller writes the right Content-Type header.
   */
  static async buildFeed(token: string): Promise<string> {
    const user = await prisma.user.findFirst({
      where: { calendarToken: token },
      select: {
        id: true,
        role: true,
        artistProfile: { select: { id: true } },
        casterProfile: { select: { id: true } },
      },
    })
    if (!user) throw new AppError('NOT_FOUND', 'Calendar not found', 404)

    const viewerSide: 'artist' | 'caster' | null =
      user.role === 'artist' ? 'artist' : user.role === 'caster' ? 'caster' : null
    if (!viewerSide) {
      // Admins don't have a per-user calendar in this MVP. Return an empty
      // calendar rather than 403 so a stale admin token doesn't break the
      // user's calendar app on the next refresh.
      return wrapCalendar([])
    }

    const profileId = viewerSide === 'artist' ? user.artistProfile?.id : user.casterProfile?.id
    if (!profileId) return wrapCalendar([])

    const bookings = await prisma.booking.findMany({
      where:
        viewerSide === 'artist'
          ? { artistId: profileId, status: { in: ['confirmed', 'completed'] } }
          : { casterId: profileId, status: { in: ['confirmed', 'completed'] } },
      include: {
        job: { select: { title: true, shootDurationHours: true } },
        caster: { select: { companyName: true } },
        artist: { select: { firstName: true } },
        contract: { select: { status: true } },
      },
      orderBy: { shootDate: 'asc' },
    })

    const events = bookings.flatMap((b) => eventLines(b, viewerSide))
    return wrapCalendar(events)
  }
}

function wrapCalendar(eventLineGroups: string[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CastFlow//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CastFlow Shoots',
    ...eventLineGroups,
    'END:VCALENDAR',
  ]
  // ICS spec requires CRLF line endings.
  return lines.join('\r\n') + '\r\n'
}
