import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('you@example.com');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.signInButton = page.getByRole('button', { name: 'Sign In to NEMO →' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}

export class DashboardPage {
  readonly page: Page;
  readonly trendGrid: Locator;
  readonly realtimeStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trendGrid = page.getByTestId('dashboard-trend-grid');
    this.realtimeStatus = page.getByTestId('realtime-status');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  nicheButton(name: string) {
    return this.page.getByRole('button', { name, exact: true });
  }

  timeframeButton(tf: '24h' | '48h' | '72h') {
    return this.page.getByRole('button', { name: tf, exact: true });
  }

  platformButton(label: string) {
    return this.page.getByRole('button', { name: label });
  }

  async waitForTrends() {
    await this.trendGrid.waitFor({ state: 'visible' });
    await this.page.locator('[data-testid="trend-card"]').first().waitFor({ timeout: 30_000 });
  }

  trendCardCount() {
    return this.page.getByTestId('trend-card').count();
  }
}
