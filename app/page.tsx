"use client";

import { useState } from "react";
import { useBucketObjects } from "@/hooks/use-bucket-objects";
import { ErrorAlert } from "@/components/error-alert";
import { UploadForm } from "@/components/upload-form";
import { ObjectList } from "@/components/object-list";
import { LinkShortener } from "@/components/link-shortener";

export default function Home() {
  const [destinationFolder, setDestinationFolder] = useState("general");

  const {
    items,
    loading,
    error,
    uploadMultiple,
    rename,
    remove,
    uploading,
    deletingKey,
    clearError,
  } = useBucketObjects("");

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Asset Management
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload and manage assets in your S3 bucket
          </p>
        </header>

        <UploadForm
          destinationFolder={destinationFolder}
          onDestinationFolderChange={setDestinationFolder}
          onUploadMultiple={uploadMultiple}
          uploading={uploading}
        />

        <LinkShortener />

        {error && <ErrorAlert message={error} onDismiss={clearError} />}

        <ObjectList
          items={items}
          loading={loading}
          onRename={rename}
          onDelete={remove}
          deletingKey={deletingKey}
        />
      </div>
    </div>
  );
}
