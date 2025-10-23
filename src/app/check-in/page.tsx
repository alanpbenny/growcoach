'use client';

import { useState } from 'react';
import CoachCard, { CoachReply } from '../components/CoachCard';
import Link from 'next/link';

export default function CheckInPage() {
  const [mood, setMood] = useState<number>(3);
  const [reflection, setReflection] = useState('');
  const [reply, setReply] = useState<CoachReply | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
   e.preventDefault();
  setError(null);
  setReply(null);

  if (!reflection.trim()) {
    setError("Please write a short reflection.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, reflection }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Coach request failed");
    setReply(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    setError(msg);  
  } finally {
    setLoading(false);
  }


  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Daily Check-In</h1>
          <Link href="/" className="text-sm underline">Home</Link>
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
                <option key={n} value={n}>{n}</option>
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
            <p className="text-xs text-gray-500 mt-1">Tip: 2–5 sentences is perfect.</p>
          </div>

          <button
            disabled={loading || !reflection.trim()}
            className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Get Coach Reply'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}

        <div className="mt-6">
          <CoachCard reply={reply} />
        </div>
      </div>
    </main>
  );
}
