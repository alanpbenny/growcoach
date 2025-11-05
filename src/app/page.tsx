'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null); // null = still checking

  // Check once on load + keep in sync with future auth changes
  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthed(!!data.user);
    };
    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleStart = () => {
    router.push(isAuthed ? '/check-in' : '/login');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-gray-900">GrowCoach</h1>
        <p className="text-gray-600">Your daily check-in & AI personal coach</p>

        <button
          onClick={handleStart}
          disabled={isAuthed === null}             // optional: wait until we know
          className="inline-block rounded-xl bg-black text-white px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
        >
          Start Today’s Check-In
        </button>
      </div>
    </main>
  );
}
