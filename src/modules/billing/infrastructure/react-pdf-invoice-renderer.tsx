import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

import type {
  InvoiceDocumentInput,
  InvoiceDocumentRenderer,
  RenderedInvoiceDocument,
} from '../application/invoice-document-renderer';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, color: '#17202a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  logo: { maxWidth: 180, maxHeight: 72, objectFit: 'contain' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8 },
  muted: { color: '#5f6b76', marginBottom: 4 },
  total: { marginTop: 28, fontSize: 16, fontWeight: 700 },
});

function formatMinorAmount(currency: string, amountMinor: bigint): string {
  return `${currency.toUpperCase()} ${(Number(amountMinor) / 100).toFixed(2)}`;
}

function InvoiceDocument({ input }: { readonly input: InvoiceDocumentInput }) {
  return (
    <Document title={`Invoice ${input.invoiceNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.muted}>{input.invoiceNumber}</Text>
          </View>
          {input.brand === null ? null : (
            <Image
              src={input.brand.providerLogoStorageKey}
              style={styles.logo}
            />
          )}
        </View>
        <Text style={styles.muted}>From: {input.providerName}</Text>
        <Text style={styles.muted}>For: {input.clientName}</Text>
        <Text style={styles.muted}>Stage: {input.stageTitle}</Text>
        <Text style={styles.total}>{formatMinorAmount(input.currency, input.totalMinor)}</Text>
      </Page>
    </Document>
  );
}

export class ReactPdfInvoiceRenderer implements InvoiceDocumentRenderer {
  async render(input: InvoiceDocumentInput): Promise<RenderedInvoiceDocument> {
    const bytes = await renderToBuffer(<InvoiceDocument input={input} />);
    return {
      bytes,
      mediaType: 'application/pdf',
      filename: `invoice-${input.invoiceNumber}.pdf`,
    };
  }
}
