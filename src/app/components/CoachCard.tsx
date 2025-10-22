"use client";

export type CoachReply = {
  validation: string;
  suggestion: string;
  tip?: string;
};

export default function CoachCard({ reply }: { reply: CoachReply | null }) {
  if (!reply) return null;
  return (
    <div className="rounded-2xl p-4 border shadow-sm max-w-xl mx-auto bg-white text-gray-900">
      <p className="text-sm opacity-80">{reply.validation}</p>
      <p className="mt-2 font-semibold">Tomorrow: {reply.suggestion}</p>
      {reply.tip && <p className="mt-1 text-sm">Tip: {reply.tip}</p>}
    </div>
  );
}
