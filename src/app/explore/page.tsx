import { redirect } from 'next/navigation';

/** Explore is retired — Dashboard is the single trends surface. */
export default function ExplorePage() {
  redirect('/dashboard');
}
