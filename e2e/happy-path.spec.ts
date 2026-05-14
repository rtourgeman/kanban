import { expect, test } from '@playwright/test';

test('field engineer can carry defects across visits and report done/open counts', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');

  await page.getByLabel('שם הפרויקט').fill('אתר בדיקה');
  await page.getByLabel('אתר / כתובת').fill('רחוב הבונים 10');
  await page.getByLabel('שם בודק').fill('דנה מהנדסת');
  await page.getByRole('button', { name: 'שמור והתחל ביקור' }).click();

  await expect(page.getByRole('heading', { name: 'ביקור עבודה' })).toBeVisible();
  await page.getByPlaceholder('הוסף משימה מהירה').fill('בדיקת מעקה גג');
  await page.getByRole('button', { name: 'הוסף משימה' }).click();
  const addedTaskCheckbox = page.getByLabel('סמן בדיקת מעקה גג כבוצע');
  await addedTaskCheckbox.click({ force: true });
  await expect(addedTaskCheckbox).toBeChecked();

  for (let index = 1; index <= 5; index += 1) {
    await page.getByRole('button', { name: 'הוסף ליקוי' }).click();
    await page.getByLabel('כותרת ליקוי').fill(`ליקוי ${index}`);
    await page.getByRole('button', { name: 'שמור ליקוי' }).click();
    await expect(page.getByText(`ליקוי ${index}`)).toBeVisible();
  }

  await expect(page.getByTestId('active-defects-count')).toHaveText('5');
  await expect(page.getByTestId('total-defects-count')).toHaveText('5');
  await expect(page.getByTestId('defect-card')).toHaveCount(5);

  await page.getByRole('button', { name: 'הפקת דוח ביקור' }).click({ force: true });
  await expect(page.getByRole('heading', { name: 'ליקויים חדשים בביקור' })).toBeVisible();
  await expect(page.getByTestId('report-new-defects-count')).toHaveText('5');
  for (let index = 1; index <= 5; index += 1) {
    await expect(page.getByTestId('report-new-defects')).toContainText(`ליקוי ${index}`);
  }

  await page.getByRole('button', { name: 'חזרה' }).click();
  await page.getByLabel('ניווט ראשי').getByRole('button', { name: 'לוח בקרה' }).click({ force: true });
  await page.getByRole('button', { name: 'ביקור חדש' }).click();

  await expect(page.getByTestId('active-defects-count')).toHaveText('5');
  await expect(page.getByTestId('defect-card')).toHaveCount(5);
  for (let index = 1; index <= 5; index += 1) {
    await expect(page.getByTestId('defect-list')).toContainText(`ליקוי ${index}`);
  }

  await page
    .getByTestId('defect-card')
    .filter({ hasText: 'ליקוי 1' })
    .getByRole('button', { name: 'סמן כטופל' })
    .click({ force: true });
  await page
    .getByTestId('defect-card')
    .filter({ hasText: 'ליקוי 2' })
    .getByRole('button', { name: 'סמן כטופל' })
    .click({ force: true });

  await expect(page.getByTestId('active-defects-count')).toHaveText('3');
  await expect(page.getByTestId('done-this-visit-count')).toHaveText('2');
  await expect(page.getByTestId('defect-card')).toHaveCount(3);

  await page.getByRole('button', { name: 'כל הליקויים' }).click();
  await expect(page.getByTestId('defect-card')).toHaveCount(5);
  for (let index = 1; index <= 5; index += 1) {
    await expect(page.getByTestId('defect-list')).toContainText(`ליקוי ${index}`);
  }

  await page.getByRole('button', { name: 'הפקת דוח ביקור' }).click({ force: true });
  await expect(page.getByRole('heading', { name: 'ליקויים שטופלו בביקור הזה' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ליקויים שעדיין פתוחים' })).toBeVisible();
  await expect(page.getByTestId('report-total-defects')).toHaveText('5');
  await expect(page.getByTestId('report-done-this-visit-count')).toHaveText('2');
  await expect(page.getByTestId('report-active-defects-count')).toHaveText('3');
  await expect(page.getByTestId('report-new-defects')).toContainText('לא נרשמו ליקויים חדשים בביקור הזה.');
  await expect(page.getByTestId('report-done-defects')).toContainText('ליקוי 1');
  await expect(page.getByTestId('report-done-defects')).toContainText('ליקוי 2');
  for (let index = 3; index <= 5; index += 1) {
    await expect(page.getByTestId('report-carried-over-defects')).toContainText(`ליקוי ${index}`);
    await expect(page.getByTestId('report-still-open-defects')).toContainText(`ליקוי ${index}`);
  }

  expect(consoleErrors).toEqual([]);
});
