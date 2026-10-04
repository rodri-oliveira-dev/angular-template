import { expect, test } from '@playwright/test';

test.describe('application smoke', () => {
  test('bootstraps and exposes the primary navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/example$/);
    await expect(page.getByRole('heading', { name: 'Feature-first by default' })).toBeVisible();

    const architectureLink = page.getByRole('link', {
      name: 'Architecture example',
    });

    await expect(architectureLink).toBeVisible();
    await architectureLink.click();
    await expect(page).toHaveURL(/\/example$/);
  });

  test('completes the reference write flow with the local API mock', async ({ page }) => {
    await page.goto('/example');

    const items = page.locator('.api-items li');

    await expect(items).toHaveCount(2);
    await page.getByRole('button', { name: 'Add example' }).click();

    await expect(items).toHaveCount(3);
    await expect(items.last()).toHaveText('Example 3');
  });
});
