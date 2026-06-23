import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baseball } from '@phosphor-icons/react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Divider } from '../components/ui/Divider';
import { H1 } from '../components/ui/Heading';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, error, signIn, signUp, signInWithGoogle } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/seasons', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (isSignUp) {
      await signUp(email, password);
      if (!useAuthStore.getState().error) setSignUpSuccess(true);
    } else {
      await signIn(email, password);
    }
    setSubmitting(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Baseball size={32} weight="fill" className="text-red-600" />
          <span className="text-xl font-bold text-strong tracking-tight">Dugout</span>
        </div>

        {signUpSuccess ? (
          <div className="text-center space-y-4">
            <p className="text-mid font-medium">Check your email</p>
            <p className="text-soft text-sm">
              We sent a confirmation link to <span className="text-mid">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            <button
              onClick={() => { setIsSignUp(false); setSignUpSuccess(false); }}
              className="text-red-600 text-sm hover:text-red-500"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <H1 className="mb-6">
              {isSignUp ? 'Create your account' : 'Sign in to Dugout'}
            </H1>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-well border border-firm rounded-lg px-3 py-2.5 text-strong placeholder-soft focus:outline-none focus:border-red-600/50 text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-well border border-firm rounded-lg px-3 py-2.5 text-strong placeholder-soft focus:outline-none focus:border-red-600/50 text-sm"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </Button>

            <Divider label="or" />

            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-panel border border-firm hover:border-firm hover:bg-well text-strong text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M47.532 24.552c0-1.636-.132-3.2-.388-4.688H24v9.024h13.204c-.576 3.036-2.292 5.608-4.868 7.332v6.084h7.876c4.612-4.248 7.32-10.512 7.32-17.752z" fill="#4285F4"/>
                <path d="M24 48c6.48 0 11.916-2.148 15.888-5.82l-7.876-6.084c-2.148 1.44-4.896 2.292-8.012 2.292-6.156 0-11.376-4.152-13.236-9.744H2.616v6.276C6.572 42.948 14.712 48 24 48z" fill="#34A853"/>
                <path d="M10.764 28.644A14.895 14.895 0 0 1 9.9 24c0-1.62.276-3.192.864-4.644v-6.276H2.616A23.94 23.94 0 0 0 0 24c0 3.876.924 7.548 2.616 10.92l8.148-6.276z" fill="#FBBC05"/>
                <path d="M24 9.504c3.468 0 6.576 1.188 9.024 3.54l6.756-6.756C35.916 2.388 30.48 0 24 0 14.712 0 6.572 5.052 2.616 13.08l8.148 6.276C12.624 13.656 17.844 9.504 24 9.504z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-soft">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-red-600 hover:text-red-500"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
