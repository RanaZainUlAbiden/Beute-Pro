import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductMedia {
  id: number;
  product_id: string;
  kind: 'image' | 'spin_video';
  url: string;
  storage_key?: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private url = environment.apiUrl;

  /** GET /api/admin/products/:id/media — full rows with IDs */
  listMedia(productId: string): Observable<ProductMedia[]> {
    return this.http.get<{ media: ProductMedia[] }>(this.productMediaUrl(productId)).pipe(
      map((response) => response.media),
    );
  }

  /** POST /api/admin/products/:id/media/images — multipart, field "files" */
  uploadImages(productId: string, files: File[]): Observable<ProductMedia[]> {
    const body = new FormData();
    for (const file of files) body.append('files', file);
    return this.http.post<{ media: ProductMedia[] }>(`${this.productMediaUrl(productId)}/images`, body).pipe(
      map((response) => response.media),
    );
  }

  /** POST /api/admin/products/:id/media/video — multipart, field "file" */
  uploadVideo(productId: string, file: File): Observable<ProductMedia> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ media: ProductMedia }>(`${this.productMediaUrl(productId)}/video`, body).pipe(
      map((response) => response.media),
    );
  }

  /** DELETE /api/admin/products/:id/media/:mediaId */
  deleteMedia(productId: string, mediaId: number): Observable<void> {
    return this.http.delete<{ success: boolean }>(`${this.productMediaUrl(productId)}/${mediaId}`).pipe(
      map(() => undefined),
    );
  }

  private productMediaUrl(productId: string): string {
    return `${this.url}/admin/products/${encodeURIComponent(productId)}/media`;
  }
}
