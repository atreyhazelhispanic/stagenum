# Stagenum Clickable Prototype

This directory contains a static, mobile-first product prototype backed entirely
by synthetic repository fixtures. It does not authenticate users, upload files,
send notifications, or process payments.

## Local development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
```

## Guided browser tests

Install the Chromium test browser once, then run the suite:

```bash
npx playwright install chromium
npm run test:e2e
```

The product scope and validation criteria are documented in
[`docs/product/clickable-prototype.md`](../docs/product/clickable-prototype.md).

## Data safety

Do not add real client, contractor, project, invoice, evidence, or payment data.
Demo records must remain synthetic and safe to publish.
