"use client";

import { useState, useCallback, useEffect } from "react";
import type { BucketItem } from "@/types/bucket";
import {
  fetchObjects,
  uploadObject as apiUpload,
  uploadObjects as apiUploadMultiple,
  renameObject as apiRename,
  deleteObject as apiDelete,
} from "@/lib/api";

export interface UseBucketObjectsResult {
  items: BucketItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  upload: (file: File, key?: string) => Promise<void>;
  uploadMultiple: (files: File[], destinationFolder: string) => Promise<void>;
  rename: (oldKey: string, newKey: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
  uploading: boolean;
  deletingKey: string | null;
  clearError: () => void;
}

export function useBucketObjects(prefix: string): UseBucketObjectsResult {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchObjects(prefix);
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [prefix]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upload = useCallback(
    async (file: File, key?: string) => {
      setUploading(true);
      setError(null);
      try {
        await apiUpload(file, key);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [refetch],
  );

  const uploadMultiple = useCallback(
    async (files: File[], destinationFolder: string) => {
      if (files.length === 0) return;
      setUploading(true);
      setError(null);
      try {
        await apiUploadMultiple(files, destinationFolder);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [refetch],
  );

  const rename = useCallback(
    async (oldKey: string, newKey: string) => {
      setError(null);
      try {
        await apiRename(oldKey, newKey);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Rename failed");
      }
    },
    [refetch],
  );

  const remove = useCallback(
    async (key: string) => {
      setDeletingKey(key);
      setError(null);
      try {
        await apiDelete(key);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      } finally {
        setDeletingKey(null);
      }
    },
    [refetch],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    items,
    loading,
    error,
    refetch,
    upload,
    uploadMultiple,
    rename,
    remove,
    uploading,
    deletingKey,
    clearError,
  };
}
