'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  // If already logged in, go to /check-in
 useEffect(() => {
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) router.push('/check-in');
  };
  checkUser();

  // also listen for auth changes
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) router.push('/check-in');
  });

  return () => listener.subscription.unsubscribe();
}, [router]);


  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'http://localhost:3000' } });
    setMsg(error ? error.message : 'Check your email for a login link!');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Sign in to GrowCoach</h1>
        <form onSubmit={sendMagicLink} className="space-y-2">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="w-full rounded-lg bg-black text-white py-2">Send magic link</button>
        </form>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    </main>
  );
}
