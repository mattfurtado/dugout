import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Baseball } from '@phosphor-icons/react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type InviteDetails = { season_id: string; team_name: string; season_name: string; age_group: string; year: number };

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Load invite details (public RPC — no auth required)
  useEffect(() => {
    if (!token) return;
    supabase.rpc('get_invite_details', { invite_id: token }).then(({ data }) => {
      if (!data || data.length === 0) { setNotFound(true); return; }
      setDetails(data[0] as InviteDetails);
    });
  }, [token]);

  // Auto-accept once the user is signed in and invite details are loaded
  useEffect(() => {
    if (!user || !details || done || accepting) return;
    setAccepting(true);
    supabase.rpc('accept_coach_invite', { invite_id: token }).then(({ error: rpcError }) => {
      setAccepting(false);
      if (rpcError) { setError(rpcError.message); return; }
      setDone(true);
    });
  }, [user, details]);

  const handleSignIn = () => {
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Baseball size={24} weight="fill" className="text-green-500" />
          <span className="text-lg font-bold text-zinc-100">Dugout</span>
        </div>

        {notFound && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-zinc-400 text-sm">This invite link is invalid or has expired.</p>
          </div>
        )}

        {!notFound && !details && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin" />
          </div>
        )}

        {details && !done && !accepting && !user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h1 className="text-base font-bold text-zinc-100">{teamLabel}</h1>
            {subLabel && <p className="text-xs text-zinc-500 mt-0.5">{subLabel}</p>}
            <p className="text-sm text-zinc-400 mt-3 mb-5">
              You've been invited to join as a coach. Sign in to accept.
            </p>
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-sm rounded-lg px-4 py-2.5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>
            {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}
          </div>
        )}

        {(accepting || (user && details && !done)) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Joining {teamLabel}…</p>
            {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
          </div>
        )}

        {done && details && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <Baseball size={24} weight="fill" className="text-green-400" />
            </div>
            <h2 className="text-base font-bold text-zinc-100 mb-1">You're in!</h2>
            <p className="text-sm text-zinc-400 mb-5">You've joined {teamLabel}. Head to the lineup ranker to submit your rankings.</p>
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
