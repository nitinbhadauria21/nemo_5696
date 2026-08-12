import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/nemo.pages';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe('Nemo dashboard UI', () => {
  test('unauthenticated /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });

  test('login page renders sign-in form', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.signInButton).toBeVisible();
  });

  test.describe('authenticated demo path', () => {
    test.skip(!email || !password, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD for UI auth tests');

    test('dashboard loads trends and filters apply without Submit', async ({ page }) => {
      const login = new LoginPage(page);
      const dash = new DashboardPage(page);

      await test.step('Sign in', async () => {
        await login.goto();
        await login.login(email!, password!);
        await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
      });

      await test.step('Trend grid visible', async () => {
        await dash.waitForTrends();
        const count = await dash.trendCardCount();
        expect(count).toBeGreaterThan(0);
        await expect(dash.realtimeStatus).toContainText(/Last ingest/i);
      });

      await test.step('Fitness niche reduces cards', async () => {
        const before = await dash.trendCardCount();
        await dash.nicheButton('Fitness').click();
        await page.waitForResponse(
          (r) => r.url().includes('/api/trends') && r.url().includes('niche=fitness') && r.ok(),
          { timeout: 20_000 }
        );
        const after = await dash.trendCardCount();
        expect(after).toBeGreaterThan(0);
        expect(after).toBeLessThanOrEqual(before);
      });

      await test.step('Window change triggers new API request', async () => {
        const responsePromise = page.waitForResponse(
          (r) => r.url().includes('/api/trends') && r.url().includes('timeframe=72h') && r.ok(),
          { timeout: 20_000 }
        );
        await dash.timeframeButton('72h').click();
        await responsePromise;
      });
    });
  });
});
