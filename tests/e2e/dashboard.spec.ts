import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
  test('dashboard route renders the dashboard page', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Dashboard/);
    await expect(page.getByRole('heading', { level: 1, name: 'Your dashboard' })).toBeVisible();
  });

  test('dashboard is reachable from the primary navigation', async ({ page }) => {
    await page.goto('/');
    const dashboardLink = page.getByRole('navigation', { name: /primary/i }).getByRole('link', {
      name: 'Dashboard',
    });
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });
});
