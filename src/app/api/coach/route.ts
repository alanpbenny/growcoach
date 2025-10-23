import { NextRequest, NextResponse } from "next/server";

type CoachReply = {
  validation: string;
  suggestion: string;
  tip?: string;
};

const SYSTEM_PROMPT = [
  "You are Grow, a concise, kind personal coach.",
  "Tone: supportive and practical, never clinical.",
  "Rules:",
  "1) Start with one sentence of validation.",
  "2) Give exactly TWO actionable suggestion for tomorrow (<=20 words).",
  "3) If mood <= 2, include a brief coping tip (<=15 words).",
  "4) Never offer medical or diagnostic advice.",
].join("\n");

export async function POST(req: NextRequest) {
  try {
    const { mood, reflection } = await req.json();
    const m = Math.max(1, Math.min(5, Number(mood) || 3));
    const r = String(reflection || "").slice(0, 1000);

    const userPrompt = [
      `Mood: ${m}/5`,
      `Reflection: """${r}"""`,
      `Return JSON ONLY with keys: validation, suggestion, tip (include tip only if mood <= 2).`,
    ].join("\n");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
