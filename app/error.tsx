"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <h2 className="mb-2 text-lg font-semibold text-zinc-100">
        Something went wrong
      </h2>
      <p className="mb-6 text-sm text-zinc-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Try again
      </button>
    </div>
  );
}
