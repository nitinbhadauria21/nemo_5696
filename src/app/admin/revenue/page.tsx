import AppLayout from '@/components/AppLayout';

export default function AdminRevenuePage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold mb-2">Revenue Dashboard</h1>
        <p className="text-muted-foreground text-sm">MRR, Razorpay settlements, and plan conversion rates.</p>
      </div>
    </AppLayout>
  );
}
