export interface BucketItem {
  key: string | undefined;
  size: number;
  lastModified: string | null;
}

export interface ListObjectsResponse {
  items: BucketItem[];
  isTruncated: boolean;
  keyCount: number;
}

export interface ApiErrorResponse {
  error: string;
}
