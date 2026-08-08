export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
            <p className="text-sm text-zinc-500">
              Loading...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}