"use client";

interface PrefixFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function PrefixFilter({ value, onChange }: PrefixFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label htmlFor="prefix" className="text-sm text-zinc-400">
        Prefix (folder)
      </label>
      <input
        id="prefix"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. images/"
        aria-describedby="prefix-description"
        className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span id="prefix-description" className="sr-only">
        Filter objects by key prefix
      </span>
    </div>
  );
}
