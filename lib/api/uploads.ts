import { postForm } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const UPLOAD_BASE_URL = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL ?? `${API_ORIGIN}/api/mobile/upload`;

export interface UploadedImage {
  fileName: string;
  originalName: string;
  relativePath: string;
  contentType: string;
  mimeType: string;
  size: number;
  optimized: boolean;
}

export interface MultipleUploadResponse {
  items: UploadedImage[];
}

function normalizePath(path: string) {
  return path.replace(/^\/+/, '');
}

export function getUploadFileUrl(path?: string | null) {
  if (!path) {
    return '';
  }

  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }

  if (path.startsWith('/api/mobile/upload/')) {
    return `${API_ORIGIN}${path}`;
  }

  return `${UPLOAD_BASE_URL}/${normalizePath(path)}`;
}

export async function uploadImage(file: File, optimize = true) {
  const formData = new FormData();
  formData.append('file', file);

  const query = new URLSearchParams({ optimize: String(optimize) }).toString();
  return postForm<UploadedImage>(`/mobile/upload?${query}`, formData);
}

export async function uploadImages(files: File[], optimize = true) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  const query = new URLSearchParams({ optimize: String(optimize) }).toString();
  return postForm<MultipleUploadResponse>(`/mobile/upload/uploads?${query}`, formData);
}
