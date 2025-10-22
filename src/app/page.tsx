import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-gray-900">GrowCoach</h1>
        <p className="text-gray-600">
          Your daily check-in & AI personal coach
        </p>
        <Link
          href="/check-in"
          className="inline-block rounded-xl bg-black text-white px-4 py-2 hover:bg-gray-800"
        >
          Start Today’s Check-In
        </Link>
      </div>
    </main>
  );
}
