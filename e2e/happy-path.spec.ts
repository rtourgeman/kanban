import { expect, test } from '@playwright/test';

test('field engineer can carry defects across visits and report done/open counts', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('שם הפרויקט').fill('אתר בדיקה');
  await page.getByLabel('אתר / כתובת').fill('רחוב הבונים 10');
  await page.getByLabel('שם בודק').fill('דנה מהנדסת');
  await page.getByRole('button', { name: 'שמור והתחל ביקור' }).click();

  await expect(page.getByRole('heading', { name: 'ביקור עבודה' })).toBeVisible();
  await page.getByPlaceholder('הוסף משימה מהירה').fill('בדיקת מעקה גג');
  await page.getByRole('button', { name: 'הוסף משימה' }).click();
  await page.getByLabel('לביצוע').first().check();

  for (let index = 1; index <= 5; index += 1) {
    await page.getByRole('button', { name: 'הוסף ליקוי' }).click();
    await page.getByLabel('כותרת ליקוי').fill(`ליקוי ${index}`);
    await page.getByRole('button', { name: 'שמור ליקוי' }).click();
    await expect(page.getByText(`ליקוי ${index}`)).toBeVisible();
  }

  await page.getByRole('button', { name: 'דו״ח' }).click();
  await expect(page.getByRole('heading', { name: 'ליקויים חדשים בביקור' })).toBeVisible();
  await expect(page.getByText('ליקוי 5')).toBeVisible();

  await page.getByRole('button', { name: 'חזרה' }).click();
  await page.getByRole('button', { name: 'לוח בקרה' }).click();
  await page.getByRole('button', { name: 'ביקור חדש' }).click();

  await expect(page.getByTestId('defect-list').getByText('ליקוי 1')).toBeVisible();
  await page.getByRole('button', { name: 'סמן כטופל' }).nth(0).click();
  await page.getByRole('button', { name: 'סמן כטופל' }).nth(0).click();

  await expect(page.getByText('3').first()).toBeVisible();
  await page.getByRole('button', { name: 'הפק דו״ח' }).click();
  await expect(page.getByRole('heading', { name: 'ליקויים שטופלו בביקור הזה' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ליקויים שעדיין פתוחים' })).toBeVisible();
});
