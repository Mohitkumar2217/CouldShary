"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className=" rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl"> 
              <div className=" mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 " >
                <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.7 2.8 17a2 2 0 0 0 1.75 3h14.9a2 2 0 0 0 1.75-3l-7.5-13.3a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div> 
              <h1 className="text-2xl font-semibold tracking-tight">
                Something went wrong
              </h1> 
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                An unexpected error occurred. Please try
                again. If the problem continues, refresh the
                page.
              </p> 
              <Button onClick={() => reset()} className=" mt-6 bg-white px-6 text-black hover:bg-zinc-200 " >
                Try again
              </Button>
            </div> 
            <p className="mt-5 text-center text-xs text-zinc-700">
              CloudShary
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}