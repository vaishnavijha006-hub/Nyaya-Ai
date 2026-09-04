import AuthPage from '@/app/auth/page';

export default function SignupPage() {
  return <AuthPage searchParams={Promise.resolve({ mode: 'signup' })} />;
}
