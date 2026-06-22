import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Baseball } from '@phosphor-icons/react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/ui/Spinner';

type InviteDetails = {
  season_id: string;
  team_name: string;
  season_name: string;
  age_group: string;
  year: number;
  has_head_coach: boolean;
};

type Role = 'Head Coach' | 'Assistant Coach';
const ROLES: Role[] = ['Head Coach', 'Assistant Coach'];
const STORAGE_KEY = 'invite_role';

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [role, setRole] = useState<Role>('Assistant Coach');
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    supabase.rpc('get_invite_details', { invite_id: token }).then(({ data }) => {
      if (!data || data.length === 0) { setNotFound(true); return; }
      const d = data[0] as InviteDetails;
      setDetails(d);
      const saved = sessionStorage.getItem(STORAGE_KEY) as Role | null;
      if (saved === 'Head Coach' && !d.has_head_coach) {
        setRole('Head Coach');
      } else if (saved === 'Assistant Coach') {
        setRole('Assistant Coach');
      } else {
        setRole(d.has_head_coach ? 'Assistant Coach' : 'Head Coach');
      }
    });
  }, [token]);

  const accept = (chosenRole: Role) => {
    if (!token) return;
    setAccepting(true);
    supabase.rpc('accept_coach_invite', { invite_id: token, coach_role: chosenRole }).then(({ error: rpcError }) => {
      setAccepting(false);
      sessionStorage.removeItem(STORAGE_KEY);
      if (rpcError) { setError(rpcError.message); return; }
      setDone(true);
    });
  };

  // Only auto-accept when returning from OAuth redirect (saved role in sessionStorage).
  // Already-logged-in users see the role selector instead.
  useEffect(() => {
    if (!user || !details || done || accepting) return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) accept(role);
  }, [user, details]);

  const handleSignIn = () => {
    sessionStorage.setItem(STORAGE_KEY, role);
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  const teamLabel = details ? (details.team_name || details.season_name) : '';
  const subLabel = details
    ? [details.team_name ? details.season_name : null, details.age_group, details.year].filter(Boolean).join(' · ')
    : '';

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Baseball size={24} weight="fill" className="text-green-500" />
          <span className="text-lg font-bold text-strong">Dugout</span>
        </div>

        {notFound && (
          <div className="bg-panel border border-subtle rounded-2xl p-6 text-center">
            <p className="text-soft text-sm">This invite link is invalid or has expired.</p>
          </div>
        )}

        {!notFound && !details && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}

        {details && !done && !accepting && (
          <div className="bg-panel border border-subtle rounded-2xl p-6">
            <h1 className="text-base font-bold text-strong">{teamLabel}</h1>
            {subLabel && <p className="text-xs text-soft mt-0.5">{subLabel}</p>}
            <p className="text-sm text-soft mt-4 mb-3">You've been invited to join as a coach. Choose your role:</p>

            <div className="flex gap-2 mb-5">
              {ROLES.map((r) => {
                const disabled = r === 'Head Coach' && details.has_head_coach;
                const active = role === r;
                return (
                  <button
                    key={r}
                    disabled={disabled}
                    onClick={() => !disabled && setRole(r)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      disabled
                        ? 'border-subtle text-ghost cursor-not-allowed'
                        : active
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-firm text-soft hover:border-firm hover:text-mid'
                    }`}
                  >
                    {r}
                    {disabled && <span className="block text-xs font-normal text-ghost mt-0.5">Already filled</span>}
                  </button>
                );
              })}
            </div>

            {user ? (
              <button
                onClick={() => accept(role)}
                className="w-full bg-green-500 hover:bg-green-400 text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
              >
                Accept Invite
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
              >
                <svg viewBox="0 0 18 18" width="18" height="18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            )}
            {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}
          </div>
        )}

        {accepting && (
          <div className="bg-panel border border-subtle rounded-2xl p-6 text-center">
            <Spinner className="mx-auto mb-3" />
            <p className="text-sm text-soft">Joining {teamLabel}…</p>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          </div>
        )}

        {done && details && (
          <div className="bg-panel border border-subtle rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <Baseball size={24} weight="fill" className="text-green-400" />
            </div>
            <h2 className="text-base font-bold text-strong mb-1">You're in!</h2>
            <p className="text-sm text-soft mb-5">You've joined {teamLabel} as {role}.</p>
            <button
              onClick={() => navigate(`/seasons/${details.season_id}`)}
              className="w-full bg-green-500 hover:bg-green-400 text-white font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
            >
              Go to Season
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
