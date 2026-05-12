import { createElement } from 'react'
import { Document, Image, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

/**
 * Comp-card PDF — a print-friendly summary of an approved artist's profile
 * + portfolio that casters can download/print. Phase-2 add-on; see
 * `ArtistService.generateCompCard` for the entry point.
 */

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    lineHeight: 1.4,
    fontFamily: 'Helvetica',
    color: '#111',
  },
  header: { fontSize: 24, fontWeight: 700, marginBottom: 2 },
  subhead: { fontSize: 11, color: '#555', marginBottom: 14 },
  twoCol: { flexDirection: 'row' as const, marginBottom: 16, gap: 16 },
  statsCol: { width: 200 },
  statsRow: { flexDirection: 'row' as const, marginBottom: 2 },
  statsLabel: { width: 90, color: '#555' },
  statsValue: { flex: 1 },
  bioCol: { flex: 1 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    color: '#222',
    marginTop: 4,
    marginBottom: 4,
  },
  portfolioGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: 6,
  },
  photoCell: {
    width: '32%',
    aspectRatio: 1,
    marginRight: '2%',
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  footer: {
    marginTop: 18,
    fontSize: 8,
    color: '#888',
    textAlign: 'center' as const,
  },
})

export interface CompCardPdfData {
  firstName: string
  artistType: 'model' | 'actor'
  city: string
  bio: string | null
  experienceLevel: string
  ratingAvg: number | null
  ratingCount: number
  jobsCompleted: number
  modelStats: {
    heightCm: number
    dressSize: string
    shoeSize: string
    bustCm: number | null
    waistCm: number | null
    hipCm: number | null
    hairColour: string
    eyeColour: string
    skinTone: string
  } | null
  actorStats: {
    heightCm: number
    hairColour: string
    eyeColour: string
    voiceType: string | null
    ageRangeMin: number
    ageRangeMax: number
  } | null
  skills: { skillType: string; skillValue: string }[]
  portfolioPhotos: string[]
}

function row(label: string, value: string) {
  return createElement(
    View,
    { style: styles.statsRow },
    createElement(Text, { style: styles.statsLabel }, label),
    createElement(Text, { style: styles.statsValue }, value)
  )
}

function buildDocument(data: CompCardPdfData) {
  const statRows = data.modelStats
    ? [
        row('Height', `${data.modelStats.heightCm} cm`),
        row('Dress size', data.modelStats.dressSize),
        row('Shoe size', data.modelStats.shoeSize),
        ...(data.modelStats.bustCm ? [row('Bust', `${data.modelStats.bustCm} cm`)] : []),
        ...(data.modelStats.waistCm ? [row('Waist', `${data.modelStats.waistCm} cm`)] : []),
        ...(data.modelStats.hipCm ? [row('Hips', `${data.modelStats.hipCm} cm`)] : []),
        row('Hair', data.modelStats.hairColour),
        row('Eyes', data.modelStats.eyeColour),
        row('Skin tone', data.modelStats.skinTone),
      ]
    : data.actorStats
      ? [
          row('Height', `${data.actorStats.heightCm} cm`),
          row('Age range', `${data.actorStats.ageRangeMin}–${data.actorStats.ageRangeMax}`),
          row('Hair', data.actorStats.hairColour),
          row('Eyes', data.actorStats.eyeColour),
          ...(data.actorStats.voiceType ? [row('Voice', data.actorStats.voiceType)] : []),
        ]
      : []

  const ratingStr =
    data.ratingAvg !== null
      ? `★ ${data.ratingAvg.toFixed(1)} (${data.ratingCount})`
      : 'New on CastFlow'

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.header }, data.firstName),
      createElement(
        Text,
        { style: styles.subhead },
        `${data.artistType[0]?.toUpperCase() ?? ''}${data.artistType.slice(1)} · ${data.city} · ${ratingStr} · ${data.jobsCompleted} jobs`
      ),
      createElement(
        View,
        { style: styles.twoCol },
        createElement(
          View,
          { style: styles.statsCol },
          createElement(Text, { style: styles.sectionTitle }, 'Stats'),
          ...(statRows as React.ReactNode[])
        ),
        createElement(
          View,
          { style: styles.bioCol },
          createElement(Text, { style: styles.sectionTitle }, 'About'),
          createElement(Text, null, data.bio ?? '—'),
          ...(data.skills.length > 0
            ? [
                createElement(Text, { style: styles.sectionTitle }, 'Skills'),
                createElement(Text, null, data.skills.map((s) => s.skillValue).join(' · ')),
              ]
            : [])
        )
      ),
      createElement(Text, { style: styles.sectionTitle }, 'Portfolio'),
      createElement(
        View,
        { style: styles.portfolioGrid },
        ...(data.portfolioPhotos
          .slice(0, 6)
          .map((src) =>
            createElement(
              View,
              { style: styles.photoCell, key: src },
              createElement(Image, { src, style: styles.photoImg })
            )
          ) as React.ReactNode[])
      ),
      createElement(Text, { style: styles.footer }, 'Generated by CastFlow · castflow.co.uk')
    )
  )
}

export async function renderCompCardPdf(data: CompCardPdfData): Promise<Buffer> {
  const stream = await pdf(buildDocument(data)).toBuffer()
  const chunks: Buffer[] = []
  return await new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
