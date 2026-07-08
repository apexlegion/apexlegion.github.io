import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('loads with hero, primary CTA, and feature cards', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/AI Atlas/);

    const hero = page.getByRole('heading', { level: 1 });
    await expect(hero).toContainText(/Learn\. Compare\. Build\./);

    const primaryCta = page.getByRole('button', { name: 'Explore the universe' });
    await expect(primaryCta).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Visual-first learning' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Curated by humans' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Learn by doing' })).toBeVisible();
  });

  test('renders the skip link on first tab', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
  });

  test('404 page is reachable for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Lost in the universe' })).toBeVisible();
  });
});
