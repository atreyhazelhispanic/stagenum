import { expect, type Page, test } from '@playwright/test';

const projectName = 'Maple Street Kitchen Remodel';
const stageName = 'Electrical & plumbing rough-in inspection';
const stageAmount = '$11,200';
const invoiceNumber = 'SN-2026-014-03';

async function openReadyStage(page: Page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

  await page
    .getByRole('button', { name: `Open project ${projectName}` })
    .click();
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

  await page.getByRole('button', { name: /Review submission/ }).click();
  await expect(page.getByRole('heading', { name: stageName })).toBeVisible();
}

async function submitRevisionOne(page: Page) {
  await page.getByRole('button', { name: 'Continue to confirmation' }).click();
  await expect(
    page.getByRole('heading', { name: 'Submit revision 1?' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Submit for client review' }).click();
  await expect(
    page.getByRole('heading', { name: 'Ready for client review' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Continue as client' }).click();
  await expect(page.getByText('Secure client review', { exact: true })).toBeVisible();
  await expect(page.getByText('Revision 1 · Submitted Sep 15, 2026')).toBeVisible();
}

async function completeInvoiceAndPayment(page: Page, revision: 1 | 2) {
  await page.getByRole('button', { name: 'Continue as provider' }).click();
  await expect(
    page.getByRole('heading', { name: 'Review draft invoice' }),
  ).toBeVisible();
  await expect(
    page.getByText(`Approved revision ${revision} · ${invoiceNumber}`),
  ).toBeVisible();

  await page
    .getByRole('button', { name: `Issue invoice · ${stageAmount}` })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Client invoice is ready' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Continue as client' }).click();
  await expect(
    page.getByRole('heading', { name: `Invoice ${invoiceNumber}` }),
  ).toBeVisible();
  await expect(page.getByText(`Approved revision ${revision} · ${invoiceNumber}`)).toBeVisible();

  await page
    .getByRole('button', { name: `Pay balance · ${stageAmount}` })
    .click();
  await expect(page.getByRole('heading', { name: 'Pay balance' })).toBeVisible();

  await page.getByRole('button', { name: `Pay ${stageAmount}` }).click();
  await expect(
    page.getByRole('heading', { name: 'Payment submitted' }),
  ).toBeVisible();
  await expect(
    page.getByText('A payment attempt exists, but the invoice is not Paid until the processor confirms success.'),
  ).toBeVisible();

  await page
    .getByRole('button', { name: 'Simulate successful confirmation' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Payment received' }),
  ).toBeVisible();
  await expect(page.getByText('Amount paid').locator('..')).toContainText(stageAmount);
  await expect(page.getByText('Balance due').locator('..')).toContainText('$0.00');
  await expect(page.getByText('Invoice state').locator('..')).toContainText('Paid');

  await page.getByRole('button', { name: 'Return to projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByText('Payment received', { exact: true })).toBeVisible();
  await expect(page.getByText('Rough-in inspection paid · Next stage ready for planning')).toBeVisible();
}

test('direct approval preserves revision 1 through payment', async ({ page }) => {
  await openReadyStage(page);
  await submitRevisionOne(page);

  await page.getByRole('button', { name: 'Approve revision 1' }).click();
  await expect(page.getByRole('heading', { name: 'Stage approved' })).toBeVisible();
  await expect(
    page.getByText('The approval record points to revision 1. Stagenum prepared a draft invoice for provider review—nothing has been issued yet.'),
  ).toBeVisible();

  await completeInvoiceAndPayment(page, 1);
});

test('Change Request preserves revision 2 through payment', async ({ page }) => {
  await openReadyStage(page);
  await submitRevisionOne(page);

  await page.getByRole('button', { name: 'Request a change' }).click();
  await expect(
    page.getByRole('heading', { name: 'What needs clarification?' }),
  ).toBeVisible();

  const request = page.getByLabel('Message to Northline Residential');
  await expect(request).not.toHaveValue('');
  await page.getByRole('button', { name: 'Send Change Request' }).click();
  await expect(
    page.getByRole('heading', { name: 'Jordan has what they need' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Continue as provider' }).click();
  await expect(
    page.getByRole('heading', { name: 'Respond to the Change Request' }),
  ).toBeVisible();
  await expect(page.getByLabel('Response to the client')).not.toHaveValue('');

  await page.getByRole('button', { name: 'Review revision 2' }).click();
  await expect(
    page.getByRole('heading', { name: 'Submit revision 2?' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Submit revision 2' }).click();
  await expect(
    page.getByRole('heading', { name: 'Clarification sent for review' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Continue as client' }).click();
  await expect(page.getByText('Secure client review · Revision 2')).toBeVisible();

  await page.getByRole('button', { name: 'Approve revision 2' }).click();
  await expect(page.getByRole('heading', { name: 'Stage approved' })).toBeVisible();
  await expect(
    page.getByText('The approval record points to revision 2. Stagenum has prepared a draft invoice for the provider to review—nothing has been issued yet.'),
  ).toBeVisible();

  await completeInvoiceAndPayment(page, 2);
});

test('core direct-approval journey remains operable at mobile width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openReadyStage(page);
  await submitRevisionOne(page);

  await page.getByRole('button', { name: 'Approve revision 1' }).click();
  await expect(page.getByRole('heading', { name: 'Stage approved' })).toBeVisible();

  await completeInvoiceAndPayment(page, 1);
});

test('dashboard and reset controls support keyboard activation', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toBeFocused();

  await page.keyboard.press('Tab');
  const projectButton = page.getByRole('button', {
    name: `Open project ${projectName}`,
  });
  await expect(projectButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

  const resetButton = page.getByRole('button', { name: 'Reset demo' });
  await resetButton.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByText('Ready to submit', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('$14,800', { exact: true }).first()).toBeVisible();
});
