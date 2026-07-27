import AppLayout from '@/components/AppLayout';

export default function AdminPlatformsPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold mb-2">Platform Heatmap</h1>
        <p className="text-muted-foreground text-sm">Cross-platform usage intensity by niche and region.</p>
      </div>
    </AppLayout>
  );
}
