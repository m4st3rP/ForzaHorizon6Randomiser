import { test, expect } from '@playwright/test';

test.describe('Forza Horizon 6 Randomizer E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application and allow rolling', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Forza Horizon 6 Randomiser');

    // Wait for data to load - check for the Configuration section to be sure
    await expect(page.getByText('Configuration')).toBeVisible();

    // Click Roll
    await page.getByRole('button', { name: 'Roll', exact: true }).click();

    // Verify results appear
    await expect(page.getByText('Your Event')).toBeVisible();
    await expect(page.getByText('Seed:')).toBeVisible();
  });

  test('should persist settings in localStorage', async ({ page }) => {
    await expect(page.getByText('Configuration')).toBeVisible();

    // Deactivate all first
    await page.getByTitle('Select no categories').click();

    await page.reload();

    // Verify it's still empty (look for active buttons)
    // Active buttons have red text color (text-red-400)
    const activeButtons = page.locator('button.text-red-400');
    await expect(activeButtons).toHaveCount(0);
  });

  test('should support deep linking with seeds', async ({ page }) => {
    const seed = 'test123';
    await page.goto(`/?seed=${seed}`);

    await expect(page.locator('code')).toContainText(seed);
    await expect(page.getByText('Your Event')).toBeVisible();
  });
});
