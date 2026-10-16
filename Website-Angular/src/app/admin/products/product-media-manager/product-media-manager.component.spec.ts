import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { ProductMediaManagerComponent } from './product-media-manager.component';
import { ProductMedia, UploadService } from '../../../services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { I18nService } from '../../../core/services/i18n.service';
import { T } from '../../../core/data/i18n.data';

const image: ProductMedia = {
  id: 1, product_id: 'test', kind: 'image', url: '/assets/img/products/almond-oil/almond-oil-1.webp',
  mime_type: 'image/webp', file_size: 1024, sort_order: 0, created_at: '2026-10-16T00:00:00Z',
};
const video: ProductMedia = {
  ...image, id: 2, kind: 'spin_video', url: '/assets/video/spin/almond-oil.mp4', mime_type: 'video/mp4',
};

describe('ProductMediaManagerComponent', () => {
  let fixture: ComponentFixture<ProductMediaManagerComponent>;
  let api: jasmine.SpyObj<UploadService>;
  let changed: ProductMedia[][];
  let language: 'en' | 'ar';
  const png = () => new File(['image'], 'image.png', { type: 'image/png' });
  const mp4 = () => new File(['video'], 'spin.mp4', { type: 'video/mp4' });
  const host = () => fixture.nativeElement as HTMLElement;
  const buttons = () => Array.from(host().querySelectorAll<HTMLButtonElement>('button'));
  const click = (label: RegExp) => {
    const button = buttons().find((element) => label.test(element.textContent?.trim() ?? ''));
    expect(button).withContext(`Missing button ${label}`).toBeDefined();
    button!.click();
    fixture.detectChanges();
  };
  const select = (kind: 'images' | 'video', files: File[]) => {
    const input = host().querySelector<HTMLInputElement>(kind === 'images' ? 'input[multiple]' : 'input:not([multiple])')!;
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    return input;
  };
  const mount = (id = 'test') => {
    fixture = TestBed.createComponent(ProductMediaManagerComponent);
    fixture.componentRef.setInput('productId', id);
    changed = [];
    fixture.componentInstance.mediaChanged.subscribe((rows) => changed.push(rows));
    fixture.detectChanges();
  };

  beforeEach(() => {
    language = 'en';
    api = jasmine.createSpyObj<UploadService>('UploadService', ['listMedia', 'uploadImages', 'uploadVideo', 'deleteMedia']);
    api.listMedia.and.returnValue(of([]));
    api.uploadImages.and.returnValue(of([image]));
    api.uploadVideo.and.returnValue(of(video));
    api.deleteMedia.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [ProductMediaManagerComponent],
      providers: [
        { provide: UploadService, useValue: api },
        { provide: ToastService, useValue: { show: jasmine.createSpy('show') } },
        { provide: I18nService, useValue: { t: (key: keyof typeof T.en) => T[language][key], isRTL: () => language === 'ar' } },
      ],
    });
  });
  afterEach(() => fixture?.destroy());

  it('loads full media, shows ordered images/video and emits the initial list', () => {
    api.listMedia.and.returnValue(of([video, { ...image, id: 3, sort_order: 1 }, image]));
    mount();
    expect(api.listMedia).toHaveBeenCalledOnceWith('test');
    expect(host().querySelectorAll('.image-grid img').length).toBe(2);
    expect(host().querySelector('video')?.getAttribute('src')).toBe(video.url);
    expect(changed[0].map((row) => row.id)).toEqual([1, 3, 2]);
  });

  it('explains empty media and does not fetch or upload for an unsaved product', () => {
    mount('');
    expect(api.listMedia).not.toHaveBeenCalled();
    expect(host().textContent).toContain('Save the product');
    expect(host().querySelector<HTMLInputElement>('input[multiple]')?.disabled).toBeTrue();
  });

  it('renders empty hints and offers both keyboard-accessible file picker buttons', () => {
    mount();
    expect(host().textContent).toContain('No uploaded images');
    expect(host().textContent).toContain('No uploaded video');
    expect(buttons().some((button) => button.textContent?.trim() === 'Choose images' && !button.disabled)).toBeTrue();
    expect(buttons().some((button) => button.textContent?.trim() === 'Choose video' && !button.disabled)).toBeTrue();
  });

  it('shows a load error and retries without enabling mutations against an unknown list', () => {
    api.listMedia.and.returnValues(throwError(() => new HttpErrorResponse({ status: 403 })), of([image]));
    mount();
    expect(host().textContent).toContain('Admin access is required');
    expect(host().querySelector<HTMLInputElement>('input[multiple]')?.disabled).toBeTrue();
    click(/^Try again$/);
    expect(host().querySelectorAll('.image-grid img').length).toBe(1);
    expect(host().querySelector<HTMLInputElement>('input[multiple]')?.disabled).toBeFalse();
  });

  it('retains valid selected images and names invalid/empty/oversize files without uploading', () => {
    mount();
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    const input = select('images', [png(), new File(['svg'], 'bad.svg', { type: 'image/svg+xml' }), new File([], 'empty.png', { type: 'image/png' }), large]);
    expect(host().querySelectorAll('.file-queue li').length).toBe(1);
    expect(host().querySelectorAll('.validation-errors li').length).toBe(3);
    expect(host().textContent).toContain('bad.svg');
    expect(host().textContent).toContain('10 MB limit');
    expect(api.uploadImages).not.toHaveBeenCalled();
    expect(input.value).toBe('');
    click(/^Remove$/);
    expect(host().querySelectorAll('.file-queue li').length).toBe(0);
  });

  it('rejects more than ten queued images and multiple videos', () => {
    mount();
    select('images', Array.from({ length: 11 }, (_, i) => new File(['x'], `${i}.png`, { type: 'image/png' })));
    select('video', [mp4(), mp4()]);
    expect(host().textContent).toContain('Choose up to 10 images');
    expect(host().textContent).toContain('Choose one MP4');
    expect(host().querySelectorAll('.file-queue li').length).toBe(0);
  });

  it('accepts exactly ten images and the inclusive 10 MB limit', () => {
    mount();
    const files = [new File([new Uint8Array(10 * 1024 * 1024)], 'limit.png', { type: 'image/png' }),
      ...Array.from({ length: 9 }, (_, i) => new File(['x'], `${i}.webp`, { type: 'image/webp' }))];
    select('images', files);
    expect(host().querySelectorAll('.file-queue li').length).toBe(10);
    expect(host().querySelectorAll('.validation-errors li').length).toBe(0);
  });

  it('supports drag/drop and prevents default browser file navigation', () => {
    mount();
    const transfer = new DataTransfer();
    transfer.items.add(png());
    const event = new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true });
    host().querySelector('.upload-box')!.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBeTrue();
    expect(host().querySelectorAll('.file-queue li').length).toBe(1);
  });

  it('uploads a batch once, exposes indeterminate progress, then emits the updated list', () => {
    const response = new Subject<ProductMedia[]>();
    api.uploadImages.and.returnValue(response);
    mount();
    const file = png();
    select('images', [file]);
    click(/^Upload images/);
    click(/^Uploading images/);
    expect(api.uploadImages).toHaveBeenCalledOnceWith('test', [file]);
    expect(host().querySelector('progress')?.hasAttribute('value')).toBeFalse();
    expect(host().querySelector<HTMLInputElement>('input[multiple]')?.disabled).toBeTrue();
    response.next([image]); response.complete(); fixture.detectChanges();
    expect(changed.at(-1)).toEqual([image]);
    expect(host().querySelector('progress')).toBeNull();
    expect(host().querySelectorAll('.file-queue li').length).toBe(0);
  });

  it('keeps selected files and existing media after a validation failure so the admin can retry', () => {
    api.listMedia.and.returnValue(of([image]));
    api.uploadImages.and.returnValues(throwError(() => new HttpErrorResponse({ status: 413 })), of([{ ...image, id: 4 }]));
    mount(); select('images', [png()]); click(/^Upload images/);
    expect(host().textContent).toContain('upload was rejected');
    expect(host().querySelectorAll('.file-queue li').length).toBe(1);
    expect(host().querySelectorAll('.image-grid img').length).toBe(1);
    click(/^Upload images/);
    expect(changed.at(-1)?.map((row) => row.id)).toEqual([1, 4]);
  });

  it('refetches after an ambiguous failure instead of automatically repeating an upload', () => {
    api.listMedia.and.returnValues(of([]), of([image]));
    api.uploadImages.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    mount(); select('images', [png()]); click(/^Upload images/);
    expect(api.uploadImages).toHaveBeenCalledTimes(1);
    expect(api.listMedia).toHaveBeenCalledTimes(2);
    expect(changed.at(-1)).toEqual([image]);
    expect(host().textContent).toContain('Check what was saved');
    expect(host().querySelectorAll('.file-queue li').length).toBe(1);
  });

  it('requires confirmation before deleting and waits for the server before removing a row', () => {
    const response = new Subject<void>();
    api.listMedia.and.returnValue(of([image, video]));
    api.deleteMedia.and.returnValue(response);
    mount(); click(/^Delete$/);
    expect(host().querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(api.deleteMedia).not.toHaveBeenCalled();
    const confirm = host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')[1];
    confirm.click(); fixture.detectChanges();
    expect(api.deleteMedia).toHaveBeenCalledOnceWith('test', 1);
    expect(host().querySelectorAll('.image-grid img').length).toBe(1);
    response.next(); response.complete(); fixture.detectChanges();
    expect(changed.at(-1)).toEqual([video]);
    expect(host().querySelector('app-confirm-dialog')).toBeNull();
  });

  it('keeps failed deletions visible and presents an inline error inside the confirmation', () => {
    api.listMedia.and.returnValue(of([image]));
    api.deleteMedia.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    mount(); click(/^Delete$/);
    host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')[1].click(); fixture.detectChanges();
    expect(host().querySelector('[role="alertdialog"]')?.textContent).toContain('Admin access is required');
    expect(host().querySelectorAll('.image-grid img').length).toBe(1);
  });

  it('uploads a first video and asks before replacing an existing video', () => {
    mount(); select('video', [mp4()]); click(/^Upload video$/);
    expect(api.uploadVideo).toHaveBeenCalledTimes(1);
    expect(changed.at(-1)).toEqual([video]);
    select('video', [mp4()]); click(/^Replace video$/);
    expect(host().querySelector('[role="alertdialog"]')?.textContent).toContain('overwritten');
    expect(api.uploadVideo).toHaveBeenCalledTimes(1);
    host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')[0].click(); fixture.detectChanges();
    expect(host().querySelectorAll('.file-queue li').length).toBe(1);
  });

  it('deletes the video independently of images', () => {
    api.listMedia.and.returnValue(of([image, video]));
    mount(); click(/^Delete video$/);
    host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')[1].click(); fixture.detectChanges();
    expect(api.deleteMedia).toHaveBeenCalledOnceWith('test', video.id);
    expect(changed.at(-1)).toEqual([image]);
    expect(host().querySelector('video')).toBeNull();
  });

  it('replaces a video only after confirmation and reloads the same-URL preview', () => {
    api.listMedia.and.returnValue(of([image, video]));
    api.uploadVideo.and.returnValue(of({ ...video, file_size: 2000 }));
    mount();
    const load = spyOn(host().querySelector('video')!, 'load').and.stub();
    select('video', [mp4()]); click(/^Replace video$/);
    host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')[1].click(); fixture.detectChanges();
    expect(api.uploadVideo).toHaveBeenCalledTimes(1);
    expect(changed.at(-1)?.filter((row) => row.kind === 'spin_video')).toEqual([{ ...video, file_size: 2000 }]);
    expect(host().querySelector('app-confirm-dialog')).toBeNull();
    expect(load).toHaveBeenCalled();
  });

  it('puts focus on the safe confirmation action and supports Escape without deletion', async () => {
    api.listMedia.and.returnValue(of([image]));
    mount(); click(/^Delete$/); await fixture.whenStable();
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel');
    expect(host().querySelectorAll('.cdk-focus-trap-anchor').length).toBe(2);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); fixture.detectChanges();
    expect(host().querySelector('app-confirm-dialog')).toBeNull();
    expect(api.deleteMedia).not.toHaveBeenCalled();
  });

  it('does not dismiss a delete confirmation while the request is pending', () => {
    api.listMedia.and.returnValue(of([image]));
    api.deleteMedia.and.returnValue(new Subject<void>());
    mount(); click(/^Delete$/);
    host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')[1].click(); fixture.detectChanges();
    host().querySelector('.adm-modal')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); fixture.detectChanges();
    expect(host().querySelector('app-confirm-dialog')).not.toBeNull();
    expect(Array.from(host().querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')).every((button) => button.disabled)).toBeTrue();
    expect(document.activeElement).toBe(host().querySelector('[role="alertdialog"]'));
    expect(host().querySelector('[role="alertdialog"]')?.getAttribute('tabindex')).toBe('0');
  });

  it('blocks further changes if reconciliation fails and preserves queued files for a later refresh', () => {
    api.listMedia.and.returnValues(of([]), throwError(() => new HttpErrorResponse({ status: 0 })), of([image]));
    api.uploadImages.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { error: 'private server details' } })));
    mount(); select('images', [png()]); click(/^Upload images/);
    expect(host().textContent).not.toContain('private server details');
    expect(host().querySelector<HTMLInputElement>('input[multiple]')?.disabled).toBeTrue();
    expect(host().querySelectorAll('.file-queue li').length).toBe(1);
    click(/^Try again$/);
    expect(host().querySelector<HTMLInputElement>('input[multiple]')?.disabled).toBeFalse();
    expect(api.uploadImages).toHaveBeenCalledTimes(1);
  });

  it('rejects image files in the video picker', () => {
    mount(); select('video', [png()]);
    expect(host().querySelector('.validation-errors')?.textContent).toContain('choose an MP4 video');
    expect(host().querySelectorAll('.file-queue li').length).toBe(0);
    expect(api.uploadVideo).not.toHaveBeenCalled();
  });

  it('cancels an old product upload when its input changes and never emits old rows into the new product', () => {
    const response = new Subject<ProductMedia[]>();
    api.uploadImages.and.returnValue(response);
    mount(); select('images', [png()]); click(/^Upload images/);
    expect(response.observed).toBeTrue();
    fixture.componentRef.setInput('productId', 'other'); fixture.detectChanges();
    expect(response.observed).toBeFalse();
    response.next([image]); response.complete(); fixture.detectChanges();
    expect(changed.at(-1)).toEqual([]);
    expect(host().querySelectorAll('.file-queue li').length).toBe(0);
    expect(host().querySelector('progress')).toBeNull();
  });

  it('discards stale responses and pending files when the product input changes', () => {
    const old = new Subject<ProductMedia[]>();
    api.listMedia.and.returnValues(old, of([{ ...image, id: 10, product_id: 'other' }]));
    mount(); fixture.componentRef.setInput('productId', 'other'); fixture.detectChanges();
    old.next([image]); old.complete(); fixture.detectChanges();
    expect(api.listMedia).toHaveBeenCalledWith('other');
    expect(changed.at(-1)?.map((row) => row.id)).toEqual([10]);
    expect(changed.flat().some((row) => row.product_id === 'test')).toBeFalse();
  });

  it('unsubscribes pending requests when destroyed', () => {
    const response = new Subject<ProductMedia[]>();
    api.listMedia.and.returnValue(response);
    mount(); expect(response.observed).toBeTrue();
    fixture.destroy(); expect(response.observed).toBeFalse();
  });

  it('shows preview failure without taking away deletion controls', () => {
    api.listMedia.and.returnValue(of([image]));
    mount(); host().querySelector('img')!.dispatchEvent(new Event('error')); fixture.detectChanges();
    expect(host().textContent).toContain('Preview unavailable');
    expect(buttons().find((button) => button.textContent?.trim() === 'Delete')?.disabled).toBeFalse();
    const oldPreview = host().querySelector('img');
    click(/^Refresh media$/);
    expect(host().querySelector('img')).not.toBe(oldPreview);
    expect(host().querySelector('img')?.hidden).toBeFalse();
    expect(host().textContent).not.toContain('Preview unavailable');
  });

  it('renders owned labels in Arabic using the existing locale provider', () => {
    language = 'ar'; mount();
    expect(host().textContent).toContain('وسائط المنتج');
    expect(host().textContent).toContain('اختيار الصور');
    expect(host().textContent).not.toContain('Choose images');
  });
});
