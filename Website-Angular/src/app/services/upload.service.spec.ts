import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UploadService, ProductMedia } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/admin/products/test/media`;
  const image: ProductMedia = {
    id: 42, product_id: 'test', kind: 'image', url: '/uploads/products/test/test-1.png',
    storage_key: 'products/test/test-1.png', mime_type: 'image/png', file_size: 100,
    sort_order: 0, created_at: '2026-10-16T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UploadService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lists full media rows with IDs by unwrapping the response envelope', () => {
    let result: ProductMedia[] | undefined;
    service.listMedia('test').subscribe((rows) => { result = rows; });
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ media: [image] });
    expect(result).toEqual([image]);
  });

  it('returns an empty array for a product with no media', () => {
    let result: ProductMedia[] | undefined;
    service.listMedia('test').subscribe((rows) => { result = rows; });
    http.expectOne(url).flush({ media: [] });
    expect(result).toEqual([]);
  });

  it('uploads every image as files, preserving file order and letting the browser set Content-Type', () => {
    const files = [new File(['first'], 'first.png', { type: 'image/png' }), new File(['second'], 'second.webp', { type: 'image/webp' })];
    let result: ProductMedia[] | undefined;
    service.uploadImages('test', files).subscribe((rows) => { result = rows; });
    const req = http.expectOne(`${url}/images`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Content-Type')).toBeFalse();
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(Array.from(req.request.body.keys())).toEqual(['files', 'files']);
    expect(req.request.body.getAll('files')).toEqual(files);
    req.flush({ media: [image] });
    expect(result).toEqual([image]);
  });

  it('uploads a video as one file field and unwraps the returned row', () => {
    const file = new File(['video'], 'spin.mp4', { type: 'video/mp4' });
    const video: ProductMedia = { ...image, id: 43, kind: 'spin_video', mime_type: 'video/mp4', url: '/uploads/spin-videos/test.mp4', storage_key: 'spin-videos/test.mp4' };
    let result: ProductMedia | undefined;
    service.uploadVideo('test', file).subscribe((row) => { result = row; });
    const req = http.expectOne(`${url}/video`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.has('Content-Type')).toBeFalse();
    expect(req.request.body instanceof FormData).toBeTrue();
    expect(Array.from(req.request.body.keys())).toEqual(['file']);
    expect(req.request.body.get('file')).toBe(file);
    req.flush({ media: video });
    expect(result).toEqual(video);
  });

  it('deletes the selected product/media pair and emits void for the JSON acknowledgement', () => {
    let emitted = false;
    let result: unknown = 'not emitted';
    service.deleteMedia('test', 42).subscribe((value) => { emitted = true; result = value; });
    const req = http.expectOne(`${url}/42`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ success: true });
    expect(emitted).toBeTrue();
    expect(result).toBeUndefined();
  });

  it('encodes the product ID as a single path segment', () => {
    service.listMedia('test/other?flag=true').subscribe();
    const req = http.expectOne((request) => request.method === 'GET');
    expect(req.request.urlWithParams).toBe(`${environment.apiUrl}/admin/products/test%2Fother%3Fflag%3Dtrue/media`);
    req.flush({ media: [] });
  });

  const failures: { name: string; request: () => Observable<unknown>; path: string; status: number }[] = [
    { name: 'list', request: () => service.listMedia('test'), path: '', status: 404 },
    { name: 'images', request: () => service.uploadImages('test', [new File(['image'], 'image.png')]), path: '/images', status: 413 },
    { name: 'video', request: () => service.uploadVideo('test', new File(['video'], 'spin.mp4')), path: '/video', status: 415 },
    { name: 'delete', request: () => service.deleteMedia('test', 42), path: '/42', status: 403 },
  ];
  for (const scenario of failures) {
    it(`preserves ${scenario.name} HTTP errors for the future UI`, () => {
      let error: HttpErrorResponse | undefined;
      scenario.request().subscribe({ next: () => fail('Expected an error'), error: (value) => { error = value; } });
      http.expectOne(url + scenario.path).flush({ error: 'Backend validation message' }, { status: scenario.status, statusText: 'Rejected' });
      expect(error?.status).toBe(scenario.status);
      expect(error?.error).toEqual({ error: 'Backend validation message' });
    });
  }
});
