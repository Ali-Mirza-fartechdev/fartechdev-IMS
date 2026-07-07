import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { Invoice, Settings } from '@/types/database'

// Matches generate_invoice.py reference layout exactly:
// dark background, blue title/headers, Bill to/Payable to box,
// item table, totals block, footer logo + signature.

const COLORS = {
  bg: '#1A1A1A',
  blue: '#29A7F2',
  white: '#FFFFFF',
  lightGray: '#C8C8C8',
  mutedGray: '#9A9A9A',
  border: '#555555',
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.bg, padding: 40, fontFamily: 'Helvetica', color: COLORS.white },
  title: { fontSize: 40, fontFamily: 'Helvetica-Bold', color: COLORS.blue, marginBottom: 24 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metaLeft: { width: '45%' },
  metaLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.white, marginTop: 8 },
  metaValue: { fontSize: 10, color: COLORS.lightGray, marginTop: 2 },
  box: { width: '52%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 2, flexDirection: 'row' },
  boxCol: { flex: 1, padding: 12 },
  boxDivider: { width: 1, backgroundColor: COLORS.border },
  boxLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.white, marginBottom: 6 },
  boxLine: { fontSize: 9, color: COLORS.lightGray, marginBottom: 3 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 6, marginBottom: 10 },
  th: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.blue },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#333', paddingVertical: 8 },
  td: { fontSize: 9.5, color: COLORS.lightGray },
  tdWhite: { fontSize: 9.5, color: COLORS.white },
  colDesc: { width: '46%' },
  colPrice: { width: '18%' },
  colQty: { width: '12%' },
  colTotal: { width: '24%', textAlign: 'right' },
  totalsBlock: { alignSelf: 'flex-end', width: '35%', marginTop: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalsLabel: { fontSize: 9.5, color: COLORS.lightGray },
  totalsValue: { fontSize: 9.5, color: COLORS.lightGray },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1.2, borderColor: COLORS.blue, paddingTop: 8, marginTop: 4 },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.blue },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.white },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerLogo: { width: 34, height: 34 * 1593 / 1117, marginRight: 10 },
  footerCompany: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.white },
  footerThanks: { fontSize: 8, color: COLORS.mutedGray, marginTop: 6, maxWidth: 220 },
  footerRight: { alignItems: 'center' },
  signatureImg: { width: 130, height: 130 * 329 / 582, marginBottom: 2 },
  signeeName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: COLORS.white, textAlign: 'center' },
  signeeTitle: { fontSize: 8, color: COLORS.mutedGray, textAlign: 'center' },
})

interface InvoicePDFProps {
  invoice: Invoice
  settings: Settings
  logoSrc: string
  signatureSrc: string
}

function fmt(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(n ?? 0)
  } catch {
    return `${currency || 'USD'} ${(n ?? 0).toFixed(2)}`
  }
}

export default function InvoicePDF({ invoice, settings, logoSrc, signatureSrc }: InvoicePDFProps) {
  const currency = invoice.currency || 'USD'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>INVOICE</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.white }}>
              Invoice #{invoice.invoice_number}
            </Text>
            <Text style={styles.metaLabel}>Invoice Date :</Text>
            <Text style={styles.metaValue}>{invoice.invoice_date}</Text>
            <Text style={styles.metaLabel}>Invoice Due Date :</Text>
            <Text style={styles.metaValue}>{invoice.due_date}</Text>
          </View>

          <View style={styles.box}>
            <View style={styles.boxCol}>
              <Text style={styles.boxLabel}>Bill to:</Text>
              <Text style={styles.boxLine}>{invoice.client?.name ?? invoice.client_name_snapshot ?? 'Client'}</Text>
              <Text style={styles.boxLine}>{invoice.client?.phone}</Text>
              <Text style={styles.boxLine}>{invoice.items?.[0]?.service_name ?? ''}</Text>
            </View>
            <View style={styles.boxDivider} />
            <View style={styles.boxCol}>
              <Text style={styles.boxLabel}>Payable to:</Text>
              <Text style={styles.boxLine}>{settings.company_name}</Text>
              <Text style={styles.boxLine}>{settings.bank_details}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDesc]}>Description</Text>
          <Text style={[styles.th, styles.colPrice]}>Price</Text>
          <Text style={[styles.th, styles.colQty]}>QTY</Text>
          <Text style={[styles.th, styles.colTotal]}>Total</Text>
        </View>

        {invoice.items?.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tdWhite, styles.colDesc]}>{item.service_name}</Text>
            <Text style={[styles.td, styles.colPrice]}>{fmt(item.unit_price, currency)}</Text>
            <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.td, styles.colTotal]}>{fmt(item.line_total, currency)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total</Text>
            <Text style={styles.totalsValue}>{fmt(invoice.subtotal, currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text style={styles.totalsValue}>{invoice.tax ? fmt(invoice.tax, currency) : '0'}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>-{fmt(invoice.discount, currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand total</Text>
            <Text style={styles.grandTotalValue}>{fmt(invoice.grand_total, currency)}</Text>
          </View>
          {invoice.amount_paid > 0 && (
            <>
              <View style={[styles.totalsRow, { marginTop: 10 }]}>
                <Text style={[styles.totalsLabel, { color: '#22C55E' }]}>Amount Paid</Text>
                <Text style={[styles.totalsValue, { color: '#22C55E' }]}>{fmt(invoice.amount_paid, currency)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { fontFamily: 'Helvetica-Bold', color: COLORS.white }]}>
                  Balance Due
                </Text>
                <Text style={[styles.totalsValue, { fontFamily: 'Helvetica-Bold', color: COLORS.white }]}>
                  {fmt(invoice.balance_due, currency)}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Image src={logoSrc} style={styles.footerLogo} />
            <View>
              <Text style={styles.footerCompany}>{settings.company_name}</Text>
              <Text style={styles.footerThanks}>
                Thank you for using our services. We appreciate your trust and are committed to providing the best service possible.
              </Text>
            </View>
          </View>
          <View style={styles.footerRight}>
            <Image src={signatureSrc} style={styles.signatureImg} />
            <Text style={styles.signeeName}>{settings.finance_head_name}</Text>
            <Text style={styles.signeeTitle}>(Head of Finance)</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
