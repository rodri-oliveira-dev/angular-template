import { expect, test } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:4201';

test.describe('BFF reference integration', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: 'XSRF-TOKEN',
        value: 'e2e-xsrf-token',
        url: baseUrl,
      },
    ]);
  });

  test('uses the same-origin BFF contract for reads and writes', async ({ page }) => {
    let getHeaders: Record<string, string> | undefined;
    let postHeaders: Record<string, string> | undefined;

    await page.route('**/api/examples', async (route) => {
      const request = route.request();
      const headers = await request.allHeaders();

      if (request.method() === 'GET') {
        getHeaders = headers;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'X-Correlation-ID': 'bff-e2e-list',
          },
          json: [
            { id: 'bff-1', name: 'BFF Example 1' },
            { id: 'bff-2', name: 'BFF Example 2' },
          ],
        });
        return;
      }

      if (request.method() === 'POST') {
        postHeaders = headers;
        const body = request.postDataJSON() as { name: string };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          headers: {
            'X-Correlation-ID': 'bff-e2e-create',
          },
          json: {
            id: 'bff-3',
            name: body.name,
          },
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/example');

    const items = page.locator('.api-items li');

    await expect(items).toHaveCount(2);
    await page.getByRole('button', { name: 'Add example' }).click();
    await expect(items).toHaveCount(3);
    await expect(items.last()).toHaveText('Example 3');

    expect(getHeaders?.['x-correlation-id']).toBeTruthy();
    expect(getHeaders?.['x-xsrf-token']).toBeUndefined();
    expect(postHeaders?.['x-correlation-id']).toBeTruthy();
    expect(postHeaders?.['x-xsrf-token']).toBe('e2e-xsrf-token');
  });

  test('renders BFF Problem Details without coupling the page to transport errors', async ({
    page,
  }) => {
    let postHeaders: Record<string, string> | undefined;

    await page.route('**/api/examples', async (route) => {
      const request = route.request();

      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          json: [{ id: 'bff-1', name: 'BFF Example 1' }],
        });
        return;
      }

      if (request.method() === 'POST') {
        postHeaders = await request.allHeaders();

        await route.fulfill({
          status: 409,
          headers: {
            'Content-Type': 'application/problem+json',
            'X-Correlation-ID': 'bff-e2e-conflict',
          },
          body: JSON.stringify({
            type: 'https://example.test/problems/conflict',
            title: 'Conflict',
            status: 409,
            detail: 'The BFF rejected this example.',
          }),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/example');
    await expect(page.locator('.api-items li')).toHaveCount(1);

    await page.getByRole('button', { name: 'Add example' }).click();

    await expect(page.getByRole('alert')).toHaveText('The BFF rejected this example.');
    expect(postHeaders?.['x-xsrf-token']).toBe('e2e-xsrf-token');
  });
});
