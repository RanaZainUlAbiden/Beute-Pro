import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';
import { ProductFormComponent } from './product-form.component';
import { AdminProductsComponent } from './admin-products.component';
import { ProductMediaManagerComponent } from './product-media-manager/product-media-manager.component';
import { ApiProduct } from '../../core/models/api.model';
import { ProductService } from '../../services/product.service';
import { UploadService } from '../../services/upload.service';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { T } from '../../core/data/i18n.data';

const copy = { name: 'Test', tagline: 'Test', description: 'Test', ingredients: [], benefits: [], usage: '' };
const product = { id: 'almond-oil', category: 'oils', price: 10, oldPrice: null, badge: null, size: '10 ml',
  images: 3, spin: false, displayOrder: 0, isActive: true, mediaBaseUrl: '/legacy/images',
  videoBaseUrl: '/legacy/video', en: copy, ar: copy, createdAt: '2026-10-16T00:00:00Z', updatedAt: '2026-10-16T00:00:00Z',
  media: { images: ['uploaded.png'], video: null } } as ApiProduct;

describe('product form media integration', () => {
  let api: jasmine.SpyObj<ProductService>;
  let uploads: jasmine.SpyObj<UploadService>;
  let harness: RouterTestingHarness;
  let component: ProductFormComponent;
  let navigate: jasmine.Spy;
  let language: 'en' | 'ar';
  const host = () => harness.routeNativeElement!;
  const mount = async (edit = false) => {
    harness = await RouterTestingHarness.create();
    component = await harness.navigateByUrl(edit ? '/products/almond-oil/edit' : '/products/new', ProductFormComponent);
    harness.detectChanges();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  };
  const fillCreate = () => {
    const formCopy = { ...copy, ingredients: '', benefits: '' };
    component.form.patchValue({ id: 'test-media-form-1', category: 'oils', price: 20, en: formCopy, ar: formCopy });
  };
  const assertPayload = (payload: Record<string, unknown>) => {
    expect(Object.keys(payload).sort()).toEqual(['id', 'category', 'price', 'oldPrice', 'badge', 'size',
      'displayOrder', 'spin', 'isActive', 'en', 'ar'].sort());
    for (const key of ['images', 'mediaBaseUrl', 'videoBaseUrl', 'media']) {
      expect(Object.hasOwn(payload, key)).withContext(key).toBeFalse();
      expect(component.form.get(key)).withContext(key).toBeNull();
    }
  };
  beforeEach(() => {
    language = 'en';
    api = jasmine.createSpyObj<ProductService>('ProductService', ['getById', 'adminCreate', 'adminUpdate']);
    api.getById.and.returnValue(of({ product }));
    api.adminCreate.and.returnValue(of({ success: true, product: { ...product, id: 'test-media-form-1' } }));
    api.adminUpdate.and.returnValue(of({ success: true, product }));
    uploads = jasmine.createSpyObj<UploadService>('UploadService', ['listMedia', 'uploadImages', 'uploadVideo', 'deleteMedia']);
    uploads.listMedia.and.returnValue(of([]));
    TestBed.configureTestingModule({ providers: [
      provideRouter([{ path: 'products/new', component: ProductFormComponent },
        { path: 'products/:id/edit', component: ProductFormComponent }]),
      { provide: ProductService, useValue: api }, { provide: UploadService, useValue: uploads },
      { provide: CategoryService, useValue: { list: () => of({ categories: [{ id: 'oils', en: 'Oils', ar: 'زيوت' }] }) } },
      { provide: ToastService, useValue: { show: jasmine.createSpy('show') } },
      { provide: I18nService, useValue: { t: (key: keyof typeof T.en) => T[language][key], isRTL: () => language === 'ar' } },
    ] });
  });
  it('keeps uploaded thumbnails and the static fallback in the admin list', () => {
    expect(AdminProductsComponent.prototype.imgSrc(product)).toBe('uploaded.png');
    expect(AdminProductsComponent.prototype.imgSrc({ ...product, media: undefined })).toBe('/assets/img/products/almond-oil/almond-oil-1.webp');
  });
  it('shows save-first guidance for new products, even after an ID is typed', async () => {
    await mount(); fillCreate(); harness.detectChanges();
    expect(host().textContent).toContain(T.en['admin.media.saveFirst']);
    expect(host().querySelector('app-product-media-manager')).toBeNull();
    expect(uploads.listMedia).not.toHaveBeenCalled();
    expect(host().querySelector('[formControlName="images"], [formControlName="mediaBaseUrl"], [formControlName="videoBaseUrl"]')).toBeNull();
    expect(host().querySelector('form')?.hasAttribute('novalidate')).toBeTrue();
  });
  it('renders the real manager between basic info and copy, using the saved ID', async () => {
    await mount(true);
    const manager = harness.routeDebugElement!.query(By.directive(ProductMediaManagerComponent)).componentInstance as ProductMediaManagerComponent;
    expect(manager.productId()).toBe('almond-oil');
    expect(uploads.listMedia).toHaveBeenCalledOnceWith('almond-oil');
    expect(host().querySelector('.media-save-note')).toBeNull();
    const sections = Array.from(host().querySelector('.form-body')!.children);
    expect(sections[1].tagName.toLowerCase()).toBe('app-product-media-manager');
    expect(sections[2].textContent).toContain('English content');
    expect(component.media()).toEqual(product.media);
    expect(component.form.get('id')?.disabled).toBeTrue();
  });
  it('creates without media keys and retains the existing return-to-list navigation', async () => {
    await mount(); fillCreate(); component.onSubmit();
    expect(api.adminCreate).toHaveBeenCalledTimes(1);
    assertPayload(api.adminCreate.calls.mostRecent().args[0] as unknown as Record<string, unknown>);
    expect(api.adminUpdate).not.toHaveBeenCalled();
    expect(navigate.calls.mostRecent().args[0]).toEqual(['..']);
    expect(uploads.listMedia).not.toHaveBeenCalled();
  });
  it('updates product fields without calling media mutations or refreshing the manager', async () => {
    await mount(true); component.form.patchValue({ price: 11 }); component.onSubmit();
    expect(api.adminUpdate.calls.mostRecent().args[0]).toBe('almond-oil');
    const payload = api.adminUpdate.calls.mostRecent().args[1];
    assertPayload(payload as Record<string, unknown>); expect(payload.price).toBe(11);
    expect(uploads.uploadImages).not.toHaveBeenCalled(); expect(uploads.uploadVideo).not.toHaveBeenCalled();
    expect(uploads.deleteMedia).not.toHaveBeenCalled(); expect(uploads.listMedia).toHaveBeenCalledTimes(1);
    expect(navigate.calls.mostRecent().args[0]).toEqual(['..']);
  });
  it('does not submit the product form when a media action is clicked', async () => {
    await mount(true);
    const manager = harness.routeDebugElement!.query(By.directive(ProductMediaManagerComponent)).componentInstance as ProductMediaManagerComponent;
    const changed = jasmine.createSpy('parent mediaChanged');
    const subscription = manager.mediaChanged.subscribe(rows => {
      changed(rows);
    });
    const refresh = Array.from(host().querySelectorAll<HTMLButtonElement>('app-product-media-manager button'))
      .find(button => button.textContent?.trim() === T.en['admin.media.refresh'])!;
    refresh.click(); harness.detectChanges();
    expect(uploads.listMedia).toHaveBeenCalledTimes(2); expect(api.adminUpdate).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledOnceWith([]);
    subscription.unsubscribe();
  });
  it('keeps edit values and the mounted manager after a failed product save', async () => {
    await mount(true); spyOn(console, 'error');
    const manager = host().querySelector('app-product-media-manager');
    api.adminUpdate.and.returnValue(throwError(() => ({ error: { error: 'Try again' } })));
    component.form.patchValue({ price: 15 }); component.onSubmit(); harness.detectChanges();
    expect(component.form.value.price).toBe(15); expect(host().querySelector('app-product-media-manager')).toBe(manager);
    expect(component.isSaving()).toBeFalse(); expect(navigate).not.toHaveBeenCalled();
  });
  it('does not mount media before the saved product finishes loading', async () => {
    const response = new Subject<{ product: ApiProduct }>(); api.getById.and.returnValue(response);
    await mount(true); expect(host().querySelector('app-product-media-manager')).toBeNull();
    response.next({ product }); harness.detectChanges(); expect(uploads.listMedia).toHaveBeenCalledOnceWith('almond-oil');
  });
  it('reuses the existing Arabic save-first translation', async () => {
    language = 'ar'; await mount();
    expect(host().querySelector('.media-save-note')?.textContent).toBe(T.ar['admin.media.saveFirst']);
    expect(host().querySelector('#media-section-title')?.textContent).toBe(T.ar['admin.media.title']);
  });
});
