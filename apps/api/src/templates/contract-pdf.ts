import { createElement } from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

/**
 * Server-side contract PDF render. @react-pdf/renderer is JSX-friendly but we
 * stay on `createElement` so apps/api doesn't need to bring in a JSX runtime
 * just for this file. The rendered PDF is uploaded to the contracts R2 bucket
 * by `ContractService.persistPdf` once both parties have signed.
 */

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
    color: '#111',
  },
  header: { fontSize: 20, marginBottom: 12, fontWeight: 700 },
  meta: { fontSize: 10, color: '#555', marginBottom: 24 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    color: '#222',
  },
  row: { flexDirection: 'row' as const, marginBottom: 4 },
  label: { width: 140, color: '#555' },
  value: { flex: 1 },
  rule: { borderBottomWidth: 0.5, borderBottomColor: '#999', marginVertical: 12 },
  signatureBlock: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 24,
  },
  signaturePane: { width: '46%' },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#666',
    marginTop: 36,
    marginBottom: 4,
  },
  signatureCaption: { fontSize: 9, color: '#555' },
  footer: { marginTop: 32, fontSize: 9, color: '#888', textAlign: 'center' as const },
})

export interface ContractPdfData {
  contractId: string
  jobTitle: string
  artistLegalName: string
  casterCompanyName: string
  shootDate: Date
  shootLocation: string
  paymentTerms: string
  usageRights: string
  exclusivity: boolean
  ndaIncluded: boolean
  artistSignatureStr: string | null
  artistSignedAt: Date | null
  casterSignatureStr: string | null
  casterSignedAt: Date | null
}

function fmtDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

function row(label: string, value: string) {
  return createElement(
    View,
    { style: styles.row },
    createElement(Text, { style: styles.label }, label),
    createElement(Text, { style: styles.value }, value)
  )
}

function section(title: string, ...children: unknown[]) {
  return createElement(
    View,
    { style: styles.section },
    createElement(Text, { style: styles.sectionTitle }, title),
    ...(children as React.ReactNode[])
  )
}

function buildDocument(data: ContractPdfData) {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: styles.page },
      createElement(Text, { style: styles.header }, 'CastFlow Booking Contract'),
      createElement(
        Text,
        { style: styles.meta },
        `Contract ID: ${data.contractId}    ·    Generated ${fmtDate(new Date())}`
      ),

      section(
        'Parties',
        row('Caster', data.casterCompanyName),
        row('Artist', data.artistLegalName)
      ),

      section(
        'Job',
        row('Title', data.jobTitle),
        row('Shoot date', fmtDate(data.shootDate)),
        row('Location', data.shootLocation || '—')
      ),

      section(
        'Payment',
        row('Terms', data.paymentTerms),
        row('Usage rights', data.usageRights),
        row('Exclusivity', data.exclusivity ? 'Yes' : 'No'),
        row('NDA', data.ndaIncluded ? 'Required' : 'Not required')
      ),

      createElement(View, { style: styles.rule }),

      createElement(
        View,
        { style: styles.signatureBlock },
        createElement(
          View,
          { style: styles.signaturePane },
          createElement(
            Text,
            { style: { fontSize: 10, fontWeight: 700 } },
            data.casterSignatureStr ?? '—'
          ),
          createElement(View, { style: styles.signatureLine }),
          createElement(
            Text,
            { style: styles.signatureCaption },
            `Caster — ${fmtDate(data.casterSignedAt)}`
          )
        ),
        createElement(
          View,
          { style: styles.signaturePane },
          createElement(
            Text,
            { style: { fontSize: 10, fontWeight: 700 } },
            data.artistSignatureStr ?? '—'
          ),
          createElement(View, { style: styles.signatureLine }),
          createElement(
            Text,
            { style: styles.signatureCaption },
            `Artist — ${fmtDate(data.artistSignedAt)}`
          )
        )
      ),

      createElement(
        Text,
        { style: styles.footer },
        'CastFlow · UK casting marketplace · This is the binding contract between the parties named above.'
      )
    )
  )
}

export async function renderContractPdf(data: ContractPdfData): Promise<Buffer> {
  // `pdf(doc).toBuffer()` returns a Node stream. Drain it into a Buffer.
  const stream = await pdf(buildDocument(data)).toBuffer()
  const chunks: Buffer[] = []
  return await new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
