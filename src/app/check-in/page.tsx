'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import CoachCard, { CoachReply } from '../components/CoachCard';

type Checkin = {
  id: string;
  mood: number;
  reflection: string;
  created_at: string;
    coach_replies?: {
    summary?: string | null;
    tip?: string | null;
    actions?: string[] | null;
  }[];
};

export default function CheckInPage() {
  const router = useRouter();

  // --- Redirect if not logged in ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/auth');
    });
  }, [router]);

  // --- State ---
  const [mood, setMood] = useState<number>(3);
  const [reflection, setReflection] = useState('');
  const [reply, setReply] = useState<CoachReply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Checkin[]>([]);

  // --- Fetch check-in history on load ---
  useEffect(() => {
    const fetchHistory = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) return;

      const { data, error } = await supabase
          .from('checkins')
          .select(`
            id,
            mood,
            reflection,
            created_at,
            coach_replies (
              summary,
              tip,
              actions
            )
          `)
          .eq('user_id', userRes.user.id)
          .order('created_at', { ascending: false })
          .limit(10);

      if (error) console.error('Error fetching history:', error);
      else setHistory(data || []);
    };

    fetchHistory();
  }, []);

  // --- Handle form submission ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReply(null);

    if (!reflection.trim()) {
      setError('Please write a short reflection.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, reflection }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Coach request failed');

      // ✅ Save check-in to Supabase
      const { data: userRes } = await supabase.auth.getUser();
      if (userRes?.user) {
        const { data: inserted, error: insertErr } = await supabase
          .from('checkins')
          .insert({
            user_id: userRes.user.id,
            mood,
            reflection,
          })
          .select('*')
          .single();

        if (insertErr) throw insertErr;

                  // ✅ Save coach reply linked to the new check-in
          const { error: replyError } = await supabase.from('coach_replies').insert({
            checkin_id: inserted.id,      // link reply to that check-in
            summary: data.validation,     // AI’s validation / summary
            actions: [data.suggestion],   // store suggestion as array
            tip: data.tip ?? null,        // optional tip
          });

          if (replyError) console.error('Error saving reply:', replyError);

        // Add to history instantly
        setHistory((prev) => [inserted, ...prev]);
      }
    

      setReply(data);
      setReflection(''); // clear textarea
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // --- JSX ---
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Daily Check-In</h1>
          <div className="flex gap-3 text-sm">
            <Link href="/" className="underline">Home</Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="underline text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>

        <p className="opacity-75">Log your mood and reflection to get a coach reply.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mood (1–5)</label>
            <select
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-32 rounded-lg border px-3 py-2 bg-white"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reflection</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              rows={5}
              placeholder="What went well? What was challenging?"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: 2–5 sentences is perfect.
            </p>
          </div>

          <button
            disabled={loading || !reflection.trim()}
            className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Get Coach Reply'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600">Error: {error}</p>
        )}

        <div className="mt-6">
          <CoachCard reply={reply} />
        </div>

        {/* ✅ Recent check-ins list */}
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-3">Recent Check-Ins</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No check-ins yet. Start your first one above!
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((c) => (
                <li key={c.id} className="rounded-lg border p-3 text-sm bg-white shadow-sm">
                  <p className="font-medium">Mood: {c.mood}/5</p>
                  <p className="text-gray-700 mt-1">{c.reflection}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                  {/* ✅ Coach reply display */}
{c.coach_replies && c.coach_replies.length > 0 && (
  <div className="mt-3 border-t pt-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-2">
    <p>
      <strong>Coach:</strong> {c.coach_replies[0].summary || "No summary"}
    </p>
    {c.coach_replies[0].tip && (
      <p className="mt-1 italic text-gray-500">
        💡 Tip: {c.coach_replies[0].tip}
      </p>
    )}
    {c.coach_replies[0].actions && c.coach_replies[0].actions.length > 0 && (
      <p className="mt-1">
        <strong>Next step:</strong> {c.coach_replies[0].actions[0]}
      </p>
    )}
  </div>
)}

                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
