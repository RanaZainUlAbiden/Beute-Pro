import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { ProductService } from './product.service';
import { ProductCreatePayload } from '../core/models/api.model';

describe('ProductService media opt-in', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  for (const admin of [false, true]) {
    it(`opts the ${admin ? 'admin' : 'public'} list in while retaining filters`, () => {
      (admin ? service.adminList({ category: 'oils', page: 2 }) : service.list({ category: 'oils', page: 2 })).subscribe();
      const req = http.expectOne((request) => request.url === `${environment.apiUrl}/${admin ? 'admin/' : ''}products`);
      expect(req.request.params.get('includeMedia')).toBe('true');
      expect(req.request.params.get('category')).toBe('oils');
      expect(req.request.params.get('page')).toBe('2');
      req.flush({ products: [] });
    });
  }

  it('opts product detail in', () => {
    service.getById('test').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/products/test?includeMedia=true`);
    expect(req.request.method).toBe('GET');
    req.flush({ product: {} });
  });

  for (const create of [false, true]) {
    it(`opts the admin ${create ? 'create' : 'update'} response in without changing the payload`, () => {
      const payload = { id: 'test', images: 3 } as ProductCreatePayload;
      (create ? service.adminCreate(payload) : service.adminUpdate('test', payload)).subscribe();
      const req = http.expectOne(`${environment.apiUrl}/admin/products${create ? '' : '/test'}?includeMedia=true`);
      expect(req.request.method).toBe(create ? 'POST' : 'PUT');
      expect(req.request.body).toBe(payload);
      req.flush({ success: true, product: {} });
    });
  }

  it('never opts soft or hard delete in', () => {
    for (const hard of [false, true]) {
      service.adminDelete('test', hard).subscribe();
      const req = http.expectOne((request) => request.url === `${environment.apiUrl}/admin/products/test`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.params.has('includeMedia')).toBeFalse();
      expect(req.request.params.get('hard')).toBe(hard ? 'true' : null);
      req.flush({ success: true });
    }
  });
});
