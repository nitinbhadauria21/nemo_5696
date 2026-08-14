import type { Metadata } from 'next';
import LandingContent from './components/LandingContent';

export const metadata: Metadata = {
  title: 'Nemo — Catch the wave. Before it crashes.',
  description:
    "Nemo tells you what's blowing up, on which platform, and how many hours you have left to post about it. One score. One window.",
};

export default function LandingPage() {
  return (
    <>
      <link rel="preload" as="video" href="/landing/hero-bg.mp4" type="video/mp4" />
      <LandingContent />
    </>
  );
}
