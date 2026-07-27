import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/sign-up-login-screen?mode=login');
}
