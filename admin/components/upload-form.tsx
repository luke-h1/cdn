"use client";

import { useRef, type FormEvent } from "react";

interface UploadFormProps {
  destinationFolder: string;
  onDestinationFolderChange: (value: string) => void;
  onUploadMultiple: (files: File[], destinationFolder: string) => Promise<void>;
  uploading: boolean;
}

const FolderIcon = () => (
  <svg
    className="h-5 w-5 text-zinc-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

export function UploadForm({
  destinationFolder,
  onDestinationFolderChange,
  onUploadMultiple,
  uploading,
}: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files?.length) return;
    const fileList = Array.from(files);
    try {
      await onUploadMultiple(fileList, destinationFolder);
      e.currentTarget.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // Error surfaced by hook / ErrorAlert
    }
  }

  const uploadPath = destinationFolder.trim()
    ? `${destinationFolder.replace(/\/$/, "")}/`
    : "";

  return (
    <section
      className="mb-8 rounded-xl border border-zinc-700 bg-zinc-900/50 p-6"
      aria-labelledby="upload-heading"
    >
      <h2
        id="upload-heading"
        className="mb-4 text-sm font-medium text-zinc-400"
      >
        Upload Assets
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="destination-folder"
            className="flex items-center gap-2 text-sm text-zinc-400"
          >
            <FolderIcon />
            Destination Folder
          </label>
          <input
            id="destination-folder"
            type="text"
            value={destinationFolder}
            onChange={(e) => onDestinationFolderChange(e.target.value)}
            placeholder="e.g. general"
            className="flex-1 min-w-[160px] rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="files" className="mb-1 block text-xs text-zinc-500">
              Select Files
            </label>
            <input
              id="files"
              ref={fileInputRef}
              type="file"
              multiple
              className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white file:font-medium file:hover:bg-blue-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Select multiple files or folders to upload to{" "}
              {uploadPath || "(root)/"}
            </p>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <UploadIcon />
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </section>
  );
}
