import type { InvoiceBrandSnapshot } from '../domain/invoice-branding';

export interface InvoiceDocumentInput {
  readonly invoiceNumber: string;
  readonly providerName: string;
  readonly clientName: string;
  readonly stageTitle: string;
  readonly currency: string;
  readonly totalMinor: bigint;
  readonly brand: InvoiceBrandSnapshot | null;
}

export interface RenderedInvoiceDocument {
  readonly bytes: Uint8Array;
  readonly mediaType: 'application/pdf';
  readonly filename: string;
}

export interface InvoiceDocumentRenderer {
  render(input: InvoiceDocumentInput): Promise<RenderedInvoiceDocument>;
}
