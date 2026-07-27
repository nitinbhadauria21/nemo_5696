import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/sign-up-login-screen?mode=signup');
}
