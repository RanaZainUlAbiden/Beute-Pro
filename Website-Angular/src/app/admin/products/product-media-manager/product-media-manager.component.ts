import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, ElementRef, Injector, OnChanges, OnDestroy, OnInit,
  SimpleChanges, afterNextRender, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { Subscription, finalize, timeout } from 'rxjs';
import { ProductMedia, UploadService } from '../../../services/upload.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import type { TranslationKey } from '../../../core/data/i18n.data';
import { ConfirmDialog } from '../../ui/confirm-dialog/confirm-dialog';

type MediaKey = Extract<TranslationKey, `admin.media.${string}`>;
type UploadKind = 'images' | 'video';
type Confirmation = { action: 'delete'; media: ProductMedia } | { action: 'replaceVideo' };
const MAX_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
let nextManagerId = 0;

@Component({
  selector: 'app-product-media-manager',
  standalone: true,
  imports: [CommonModule, A11yModule, ConfirmDialog],
  templateUrl: './product-media-manager.component.html',
  styleUrl: './product-media-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductMediaManagerComponent implements OnInit, OnChanges, OnDestroy {
  /** Render only after the product has been saved and has an ID. */
  readonly productId = input.required<string>();
  readonly mediaChanged = output<ProductMedia[]>();

  private readonly uploads = inject(UploadService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly imagesButton = viewChild<ElementRef<HTMLButtonElement>>('imagesButton');
  private readonly videoButton = viewChild<ElementRef<HTMLButtonElement>>('videoButton');
  private readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoPreview');
  private requests = new Subscription();
  private generation = 0;
  private loadingRequest = false;
  protected readonly uid = `product-media-${nextManagerId++}`;
  protected readonly media = signal<ProductMedia[]>([]);
  protected readonly images = computed(() => this.media().filter((row) => row.kind === 'image').map((row) => ({
    ...row, previewKey: `${row.id}:${this.previewRevision()}`,
  })));
  protected readonly video = computed(() => this.media().find((row) => row.kind === 'spin_video') ?? null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly error = signal('');
  protected readonly status = signal('');
  protected readonly imageFiles = signal<File[]>([]);
  protected readonly videoFile = signal<File | null>(null);
  protected readonly imageErrors = signal<string[]>([]);
  protected readonly videoErrors = signal<string[]>([]);
  protected readonly uploading = signal<UploadKind | null>(null);
  protected readonly deleting = signal(false);
  protected readonly confirmation = signal<Confirmation | null>(null);
  protected readonly dragging = signal<UploadKind | null>(null);
  protected readonly failedPreviews = signal<ReadonlySet<number>>(new Set());
  protected readonly previewRevision = signal(0);
  protected readonly mutating = computed(() => this.uploading() !== null || this.deleting());
  protected readonly disabled = computed(() => this.loading() || this.mutating() || !!this.loadError() || !this.productId()?.trim());
  protected readonly dialogHeading = computed(() => this.text(this.confirmation()?.action === 'replaceVideo'
    ? 'admin.media.replaceTitle' : 'admin.media.deleteTitle'));
  protected readonly dialogBody = computed(() => {
    const pending = this.confirmation();
    const name = pending?.action === 'delete' ? pending.media.kind === 'image'
      ? this.text('admin.media.imageAlt', { count: this.images().findIndex((row) => row.id === pending.media.id) + 1 })
      : this.text('admin.media.video') : '';
    const body = `${name ? `${name}. ` : ''}${this.text(pending?.action === 'replaceVideo' ? 'admin.media.replaceBody' : 'admin.media.deleteBody')}`;
    return this.error() ? `${body} ${this.error()}` : body;
  });

  ngOnInit(): void { this.loadMedia(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && !changes['productId'].firstChange) {
      ++this.generation;
      this.requests.unsubscribe();
      this.requests = new Subscription();
      this.loadingRequest = false;
      this.media.set([]);
      this.imageFiles.set([]);
      this.videoFile.set(null);
      this.imageErrors.set([]);
      this.videoErrors.set([]);
      this.error.set('');
      this.status.set('');
      this.confirmation.set(null);
      this.uploading.set(null);
      this.deleting.set(false);
      this.dragging.set(null);
      this.failedPreviews.set(new Set());
      this.loadMedia();
    }
  }

  ngOnDestroy(): void {
    ++this.generation;
    this.requests.unsubscribe();
  }

  protected text(key: MediaKey, values: Record<string, string | number> = {}): string {
    let result = this.i18n.t(key);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, String(value));
    return result;
  }

  protected formatSize(bytes: number): string {
    const megabytes = bytes >= 1024 * 1024;
    return new Intl.NumberFormat(this.i18n.isRTL() ? 'ar-EG' : 'en-US', {
      style: 'unit', unit: megabytes ? 'megabyte' : 'kilobyte', unitDisplay: 'short',
      maximumFractionDigits: megabytes ? 1 : 0,
    }).format(bytes / (megabytes ? 1024 * 1024 : 1024));
  }

  protected loadMedia(): void {
    if (this.mutating() || this.loadingRequest) return;
    if (!this.productId()?.trim()) {
      this.loading.set(false);
      this.loadError.set(this.text('admin.media.saveFirst'));
      return;
    }
    const generation = this.generation;
    const id = this.productId();
    this.loadingRequest = true;
    this.loading.set(true);
    this.loadError.set('');
    this.requests.add(this.uploads.listMedia(id).pipe(
      timeout(30000),
      finalize(() => {
        if (generation === this.generation) { this.loading.set(false); this.loadingRequest = false; }
      }),
    ).subscribe({
      next: (rows) => {
        if (generation !== this.generation) return;
        this.failedPreviews.set(new Set());
        this.previewRevision.update((revision) => revision + 1);
        this.setMedia(rows.filter((row) => row.product_id === id));
        afterNextRender(() => { if (generation === this.generation) this.videoElement()?.nativeElement.load(); }, { injector: this.injector });
      },
      error: (error: unknown) => {
        if (generation === this.generation) this.loadError.set(this.errorMessage(error, 'admin.media.loadError'));
      },
    }));
  }

  protected selectFiles(event: Event, kind: UploadKind): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []), kind);
    input.value = ''; // Selecting the same file again must fire change after an error.
  }

  protected dragOver(event: DragEvent, kind: UploadKind): void {
    event.preventDefault();
    if (!this.disabled()) this.dragging.set(kind);
  }

  protected dragLeave(event: DragEvent): void {
    if (!(event.relatedTarget instanceof Node) || !(event.currentTarget as HTMLElement).contains(event.relatedTarget)) this.dragging.set(null);
  }

  protected dropFiles(event: DragEvent, kind: UploadKind): void {
    event.preventDefault();
    this.dragging.set(null);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []), kind);
  }

  private addFiles(files: File[], kind: UploadKind): void {
    if (this.disabled() || !files.length) return;
    if ((kind === 'images' && files.length + this.imageFiles().length > 10) || (kind === 'video' && files.length !== 1)) {
      (kind === 'images' ? this.imageErrors : this.videoErrors).set([this.text(kind === 'images'
        ? 'admin.media.imageCountError' : 'admin.media.videoCountError')]);
      return;
    }
    const valid: File[] = [];
    const errors: string[] = [];
    for (const file of files) {
      const key = file.size === 0 ? 'admin.media.emptyFile'
        : file.size > MAX_SIZE ? 'admin.media.largeFile'
          : !(kind === 'images' ? IMAGE_TYPES.has(file.type) : file.type === 'video/mp4')
            ? kind === 'images' ? 'admin.media.imageTypeError' : 'admin.media.videoTypeError' : null;
      if (key) errors.push(this.text(key, { name: file.name }));
      else valid.push(file);
    }
    (kind === 'images' ? this.imageErrors : this.videoErrors).set(errors);
    if (kind === 'images') this.imageFiles.update((current) => [...current, ...valid]);
    else if (valid[0]) this.videoFile.set(valid[0]);
    this.status.set(this.text('admin.media.selected', { count: this.imageFiles().length + (this.videoFile() ? 1 : 0) }));
  }

  protected removeFile(index: number, kind: UploadKind): void {
    if (this.disabled()) return;
    if (kind === 'images') this.imageFiles.update((files) => files.filter((_, i) => i !== index));
    else this.videoFile.set(null);
    this.status.set(this.text('admin.media.selected', { count: this.imageFiles().length + (this.videoFile() ? 1 : 0) }));
    afterNextRender(() => (kind === 'images' ? this.imagesButton() : this.videoButton())?.nativeElement.focus(), { injector: this.injector });
  }

  protected uploadImages(): void {
    if (this.disabled() || !this.imageFiles().length) return;
    const generation = this.generation;
    this.error.set('');
    this.status.set('');
    this.uploading.set('images');
    this.requests.add(this.uploads.uploadImages(this.productId(), this.imageFiles()).pipe(
      timeout(120000),
      finalize(() => { if (generation === this.generation) this.uploading.set(null); }),
    ).subscribe({
      next: (rows) => {
        if (generation !== this.generation) return;
        this.setMedia([...this.media(), ...rows]);
        this.imageFiles.set([]);
        this.imageErrors.set([]);
        this.announce('admin.media.imagesUploaded');
        afterNextRender(() => { if (generation === this.generation) this.imagesButton()?.nativeElement.focus(); }, { injector: this.injector });
      },
      error: (error: unknown) => { if (generation === this.generation) this.mutationError(error); },
    }));
  }

  protected requestVideoUpload(): void {
    if (this.disabled() || !this.videoFile()) return;
    this.error.set('');
    if (this.video()) this.confirmation.set({ action: 'replaceVideo' });
    else this.uploadVideo();
  }

  private uploadVideo(): void {
    const file = this.videoFile();
    if (this.disabled() || !file) return;
    const generation = this.generation;
    this.error.set('');
    this.status.set('');
    this.uploading.set('video');
    this.requests.add(this.uploads.uploadVideo(this.productId(), file).pipe(
      timeout(120000),
      finalize(() => { if (generation === this.generation) this.uploading.set(null); }),
    ).subscribe({
      next: (row) => {
        if (generation !== this.generation) return;
        this.setMedia([...this.media().filter((media) => media.kind !== 'spin_video'), row]);
        this.failedPreviews.update((ids) => new Set([...ids].filter((id) => id !== row.id)));
        this.videoFile.set(null);
        this.videoErrors.set([]);
        this.confirmation.set(null);
        this.announce('admin.media.videoUploaded');
        // Replacement uses the same URL: explicitly revalidate the video bytes.
        afterNextRender(() => {
          if (generation === this.generation) {
            this.videoElement()?.nativeElement.load();
            this.videoButton()?.nativeElement.focus();
          }
        }, { injector: this.injector });
      },
      error: (error: unknown) => { if (generation === this.generation) this.mutationError(error); },
    }));
  }

  protected requestDelete(media: ProductMedia): void {
    if (this.disabled() || media.product_id !== this.productId()) return;
    this.error.set('');
    this.confirmation.set({ action: 'delete', media });
  }

  protected dismissConfirmation(): void {
    if (!this.mutating()) this.confirmation.set(null);
  }

  protected confirmAction(): void {
    const pending = this.confirmation();
    if (!pending || this.disabled()) return;
    if (pending.action === 'replaceVideo') { this.uploadVideo(); return; }
    const generation = this.generation;
    const deleted = pending.media;
    this.error.set('');
    this.deleting.set(true);
    this.requests.add(this.uploads.deleteMedia(this.productId(), deleted.id).pipe(
      timeout(30000),
      finalize(() => { if (generation === this.generation) this.deleting.set(false); }),
    ).subscribe({
      next: () => {
        if (generation !== this.generation) return;
        this.setMedia(this.media().filter((row) => row.id !== deleted.id));
        this.confirmation.set(null);
        this.announce('admin.media.deleted');
        afterNextRender(() => {
          if (generation === this.generation) (deleted.kind === 'image' ? this.imagesButton() : this.videoButton())?.nativeElement.focus();
        }, { injector: this.injector });
      },
      error: (error: unknown) => { if (generation === this.generation) this.mutationError(error); },
    }));
  }

  protected previewFailed(id: number): void {
    this.failedPreviews.update((ids) => new Set([...ids, id]));
  }

  private setMedia(rows: ProductMedia[]): void {
    // Isolate local state from response objects and parent event consumers.
    const sorted = rows.map((row) => ({ ...row })).sort((a, b) => a.kind.localeCompare(b.kind) || a.sort_order - b.sort_order || a.id - b.id);
    this.media.set(sorted);
    this.mediaChanged.emit(sorted.map((row) => ({ ...row })));
  }

  private announce(key: MediaKey): void {
    const message = this.text(key);
    this.status.set(message);
    this.toast.show(message);
  }

  private mutationError(error: unknown): void {
    this.error.set(this.errorMessage(error, 'admin.media.changeError'));
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (!status || status >= 500 || status === 404) {
      // A lost response may follow a successful mutation. Never auto-retry POST.
      this.uploading.set(null);
      this.deleting.set(false);
      this.confirmation.set(null);
      this.error.set(`${this.error()} ${this.text('admin.media.checkBeforeRetry')}`);
      this.loadMedia();
    }
  }

  private errorMessage(error: unknown, fallback: MediaKey): string {
    if (!(error instanceof HttpErrorResponse)) return this.text(fallback);
    if (error.status === 0) return this.text('admin.media.networkError');
    if (error.status === 401 || error.status === 403) return this.text('admin.media.authError');
    if (error.status === 404) return this.text('admin.media.notFound');
    if (error.status === 413) return this.text('admin.media.sizeError');
    if (error.status === 415) return this.text('admin.media.formatError');
    return this.text(fallback);
  }
}
