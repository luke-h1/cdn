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

export interface LinkRecord {
  shortCode: string;
  longUrl: string;
  createdAt: string;
}

export interface ListLinksResponse {
  links: LinkRecord[];
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface KeyResponse {
  key: string;
}

export interface DeleteResponse {
  deleted: string;
}
