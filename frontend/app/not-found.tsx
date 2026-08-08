import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className=" rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl " >
            <div className=" mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 " >
              <span className="text-2xl font-semibold tracking-tight">
                404
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Page not found
            </h1> 
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              The page you're looking for doesn't exist or
              may have been moved.
            </p> 
            <Link href="/" className="inline-block">
              <Button className=" mt-6 bg-white px-6 text-black hover:bg-zinc-200 " >
                Go home
              </Button>
            </Link>
          </div> 
          <p className="mt-5 text-center text-xs text-zinc-700">
            CloudShary
          </p>
        </div>
      </div>
    </div>
  );
}