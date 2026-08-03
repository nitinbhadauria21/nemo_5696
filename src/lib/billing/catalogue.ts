import type { PlanId } from '@/lib/billing/usage';

/** Server-owned catalogue — never trust client amounts. */
export type BillingSku = 'pro_monthly' | 'pro_yearly' | 'agency_monthly' | 'agency_yearly';

export type BillingCatalogueEntry = {
  sku: BillingSku;
  plan: Exclude<PlanId, 'free'>;
  billing: 'monthly' | 'yearly';
  amountInr: number;
  label: string;
};

export const BILLING_CATALOGUE: Record<BillingSku, BillingCatalogueEntry> = {
  pro_monthly: {
    sku: 'pro_monthly',
    plan: 'pro',
    billing: 'monthly',
    amountInr: 999,
    label: 'Pro Monthly',
  },
  pro_yearly: {
    sku: 'pro_yearly',
    plan: 'pro',
    billing: 'yearly',
    amountInr: 9990,
    label: 'Pro Yearly',
  },
  agency_monthly: {
    sku: 'agency_monthly',
    plan: 'agency',
    billing: 'monthly',
    amountInr: 4999,
    label: 'Agency Monthly',
  },
  agency_yearly: {
    sku: 'agency_yearly',
    plan: 'agency',
    billing: 'yearly',
    amountInr: 49990,
    label: 'Agency Yearly',
  },
};

export function resolveSku(plan: string, billing: string): BillingCatalogueEntry | null {
  const interval = billing === 'annual' ? 'yearly' : billing;
  const key = `${plan}_${interval}` as BillingSku;
  return BILLING_CATALOGUE[key] ?? null;
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

/** Demo/offline auth only when explicitly enabled and not on Vercel/production. */
export function allowDemoAuth() {
  return !isProductionRuntime() && process.env.ALLOW_DEMO_AUTH === 'true';
}
