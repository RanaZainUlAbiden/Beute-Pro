import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService } from '../../services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { adminErrorDetail } from '../admin-api';
import { LoadingSpinnerComponent } from '../ui/loading-spinner.component';
import { LoadErrorComponent } from '../ui/load-error/load-error.component';

interface SettingField {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'number';
  placeholder?: string;
  prefix?: string;      // e.g. "₨" for money fields
  suffix?: string;      // e.g. "%" for percent fields
}

interface SettingGroup {
  title: string;
  icon: string;         // SVG path data
  fields: SettingField[];
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, LoadErrorComponent],
  template: `
    <div class="admin-settings">
      <!-- Header -->
      <div class="page-head">
        <div>
          <h1 class="h-lg">Store Settings</h1>
          <p class="page-sub">Configure shipping, contact information and storefront behaviour</p>
        </div>
        <div class="head-actions">
          <button
            class="btn btn--outline"
            (click)="reload()"
            [disabled]="isLoading() || isSaving()"
          >
            Reset
          </button>
          <button
            class="btn btn--gold"
            (click)="save()"
            [disabled]="!hasChanges() || isSaving() || isLoading() || loadError() !== null"
          >
            <svg *ngIf="!isSaving()" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                    stroke="currentColor" stroke-width="2" fill="none"
                    stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 21v-8H7v8M7 3v5h8"
                    stroke="currentColor" stroke-width="2" fill="none"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ isSaving() ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </div>

      <!-- Dirty badge -->
      <div class="dirty-banner" *ngIf="hasChanges() && !isSaving()">
        <span class="dot"></span>
        You have unsaved changes
      </div>

      <!-- Loading -->
      <app-loading-spinner *ngIf="isLoading()" message="Loading settings…"></app-loading-spinner>

      <!-- Load failed. Unlike the other screens this one still renders
           its form underneath, because an empty form here is not an
           empty state — the placeholders ("3000", "PKR") look exactly
           like real saved values. So the fields stay visible but are
           locked, and Save is disabled: the danger is not that the
           admin sees nothing, it is that they save over something. -->
      <app-load-error
        *ngIf="!isLoading() && loadError() !== null"
        [detail]="loadError()!"
        (retry)="load()"
      ></app-load-error>

      <p class="locked-note" *ngIf="!isLoading() && loadError() !== null">
        {{ i18n.t('admin.settings.lockedNote') }}
      </p>

      <!-- Groups -->
      <div class="groups" *ngIf="!isLoading()" [class.is-locked]="loadError() !== null">
        <section class="group" *ngFor="let group of groups">
          <div class="group-head">
            <div class="group-icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path [attr.d]="group.icon" stroke="currentColor" stroke-width="1.8"
                      fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2 class="group-title">{{ group.title }}</h2>
          </div>

          <div class="group-fields">
            <div class="field" *ngFor="let field of group.fields">
              <label [for]="'st-' + field.key">
                {{ field.label }}
                <span class="dirty-dot" *ngIf="isFieldDirty(field.key)"></span>
              </label>

              <div class="input-wrap" [class.has-prefix]="field.prefix" [class.has-suffix]="field.suffix">
                <span class="affix affix--prefix" *ngIf="field.prefix">{{ field.prefix }}</span>
                <input
                  [id]="'st-' + field.key"
                  [type]="field.type"
                  [placeholder]="loadError() !== null ? '' : (field.placeholder || '')"
                  [ngModel]="values()[field.key] || ''"
                  (ngModelChange)="onValueChange(field.key, $event)"
                  [disabled]="loadError() !== null"
                />
                <span class="affix affix--suffix" *ngIf="field.suffix">{{ field.suffix }}</span>
              </div>

              <small class="hint" *ngIf="field.description">{{ field.description }}</small>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-settings { padding: 0; }

    /* Locked form after a failed read */
    .locked-note {
      margin: 0.9rem 0 0;
      padding: 0.8rem 1.1rem;
      background: var(--danger-soft, #f7e7e4);
      border-inline-start: 3px solid var(--danger, #a8443c);
      border-radius: var(--r, 8px);
      color: var(--green, #0F2A1D);
      font-size: 0.85rem;
      line-height: 1.55;
    }
    .groups.is-locked { opacity: 0.55; }
    .groups.is-locked input { cursor: not-allowed; background: var(--ivory-2, #EFEADD); }

    .page-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .page-head h1 { margin: 0 0 0.25rem; color: var(--green, #0F2A1D); }
    .page-sub { margin: 0; font-size: 0.88rem; color: var(--green-soft, #5C7A68); }

    .head-actions { display: flex; gap: 0.5rem; }

    /* Dirty banner */
    .dirty-banner {
      display: flex; align-items: center; gap: 0.55rem;
      background: rgba(201, 164, 76, 0.12);
      border-left: 3px solid var(--gold, #C9A44C);
      color: var(--green, #0F2A1D);
      padding: 0.7rem 1rem;
      border-radius: var(--r, 8px);
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .dirty-banner .dot {
      width: 8px; height: 8px;
      background: var(--gold, #C9A44C);
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.5; transform: scale(1.3); }
    }

    /* Groups */
    .groups { display: flex; flex-direction: column; gap: 1.25rem; }

    .group {
      background: var(--white, #fff);
      border-radius: var(--r-lg, 18px);
      padding: 1.5rem 1.75rem 1.75rem;
      box-shadow: 0 4px 12px rgba(15, 42, 29, 0.04);
    }

    .group-head {
      display: flex; align-items: center; gap: 0.75rem;
      padding-bottom: 1rem; margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--ivory-3, #E2DBC9);
    }
    .group-icon {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: rgba(201, 164, 76, 0.14);
      color: var(--gold, #C9A44C);
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .group-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--green, #0F2A1D);
    }

    .group-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.1rem 1.5rem;
    }

    .field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .field label {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.78rem; font-weight: 700;
      color: var(--green, #0F2A1D);
    }
    .dirty-dot {
      width: 7px; height: 7px;
      background: var(--gold, #C9A44C);
      border-radius: 50%;
      display: inline-block;
    }

    /* Input with affixes */
    .input-wrap {
      position: relative;
      display: flex; align-items: stretch;
    }
    .input-wrap input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid var(--ivory-3, #E2DBC9);
      border-radius: var(--r, 8px);
      font-size: 0.9rem;
      font-family: inherit;
      color: var(--ink, #132018);
      background: var(--white, #fff);
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .input-wrap.has-prefix input { padding-left: 2.4rem; }
    .input-wrap.has-suffix input { padding-right: 2.4rem; }
    .input-wrap input:focus {
      outline: none;
      border-color: var(--gold, #C9A44C);
      box-shadow: 0 0 0 3px rgba(201, 164, 76, 0.15);
    }
    .affix {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--green-soft, #5C7A68);
      pointer-events: none;
    }
    .affix--prefix { left: 0.85rem; }
    .affix--suffix { right: 0.85rem; }

    .hint { font-size: 0.72rem; color: var(--green-soft, #5C7A68); line-height: 1.5; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.45rem;
      padding: 0.7rem 1.3rem;
      border-radius: var(--r, 8px);
      font-size: 0.82rem; font-weight: 700;
      cursor: pointer; border: 0;
      transition: background 0.3s, transform 0.3s, color 0.3s, box-shadow 0.3s;
    }
    .btn--gold { background: var(--gold, #C9A44C); color: var(--green, #0F2A1D); }
    .btn--gold:hover:not(:disabled) {
      background: var(--gold-lt, #E4C783);
      transform: translateY(-1px);
      box-shadow: 0 10px 20px -10px rgba(201, 164, 76, 0.7);
    }
    .btn--gold:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn--outline {
      background: transparent;
      border: 1.5px solid var(--green, #0F2A1D);
      color: var(--green, #0F2A1D);
    }
    .btn--outline:hover:not(:disabled) { background: var(--green, #0F2A1D); color: var(--ivory, #F7F4EC); }
    .btn--outline:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 520px) {
      .group { padding: 1.2rem; }
      .page-head { align-items: stretch; }
      .head-actions { width: 100%; }
      .head-actions .btn { flex: 1; justify-content: center; }
    }
  `],
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  isLoading = signal(true);
  isSaving = signal(false);
  /** The API's message when the read failed; null when it didn't. */
  loadError = signal<string | null>(null);

  /** Server truth — what's saved in the DB. */
  private serverValues = signal<Record<string, string>>({});

  /** Live edited values (bound to the form). */
  values = signal<Record<string, string>>({});

  hasChanges = computed(() => {
    const s = this.serverValues();
    const v = this.values();
    const keys = new Set([...Object.keys(s), ...Object.keys(v)]);
    for (const k of keys) {
      if ((s[k] ?? '') !== (v[k] ?? '')) return true;
    }
    return false;
  });

  /** Declarative list of setting fields, grouped visually. */
  readonly groups: SettingGroup[] = [
    {
      title: 'Shipping & Delivery',
      // Truck icon path
      icon: 'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
      fields: [
        {
          key: 'free_shipping_min_pkr',
          label: 'Free shipping minimum',
          description: 'Orders above this amount ship free. Enter 0 to disable.',
          type: 'number',
          prefix: '₨',
          placeholder: '3000',
        },
        {
          key: 'cod_extra_charges_pkr',
          label: 'COD extra charge',
          description: 'Additional fee for cash-on-delivery orders.',
          type: 'number',
          prefix: '₨',
          placeholder: '0',
        },
      ],
    },
    {
      title: 'Contact & Support',
      // Phone icon path
      icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z',
      fields: [
        {
          key: 'store_phone',
          label: 'Store phone',
          description: 'Displayed on the contact page and footer.',
          type: 'text',
          placeholder: '+92-300-1234567',
        },
        {
          key: 'store_whatsapp',
          label: 'WhatsApp number',
          description: 'Used for the floating WhatsApp button.',
          type: 'text',
          placeholder: '+92-300-1234567',
        },
        {
          key: 'store_email',
          label: 'Support email',
          description: 'Where customer replies should go.',
          type: 'text',
          placeholder: 'sales@beutepro.com',
        },
      ],
    },
    {
      title: 'Storefront',
      // Globe icon path
      icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
      fields: [
        {
          key: 'currency_code',
          label: 'Base currency code',
          description: 'Informational only — all prices are stored in PKR.',
          type: 'text',
          placeholder: 'PKR',
        },
        {
          key: 'store_announcement',
          label: 'Topbar announcement',
          description: 'Shown in the header topbar. Leave empty to hide.',
          type: 'text',
          placeholder: 'Cash on delivery across Pakistan · Free shipping over Rs 3,000',
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.load();
  }

  // ------------------------------------------------------------
  // Load
  // ------------------------------------------------------------
  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.settingsService.adminGetAll().subscribe({
      next: (res) => {
        this.loadError.set(null);
        this.serverValues.set({ ...res.settings });
        this.values.set({ ...res.settings });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load settings', err);
        // Both sides cleared, so hasChanges() can't go true off a
        // stale baseline while the form is locked.
        this.serverValues.set({});
        this.values.set({});
        this.loadError.set(adminErrorDetail(err, this.i18n.t('admin.common.apiDown')));
        this.toast.show(this.i18n.t('admin.common.loadFailed'));
        this.isLoading.set(false);
      },
    });
  }

  /** Guards the write even if the button is ever re-enabled by mistake. */
  private canSave(): boolean {
    return this.loadError() === null && !this.isLoading();
  }

  reload(): void {
    if (this.hasChanges() && !confirm('Discard unsaved changes?')) return;
    this.load();
  }

  // ------------------------------------------------------------
  // Editing
  // ------------------------------------------------------------
  onValueChange(key: string, value: string): void {
    this.values.update((v) => ({ ...v, [key]: value }));
  }

  isFieldDirty(key: string): boolean {
    return (this.serverValues()[key] ?? '') !== (this.values()[key] ?? '');
  }

  // ------------------------------------------------------------
  // Save
  // ------------------------------------------------------------
  save(): void {
    if (!this.hasChanges() || !this.canSave()) return;

    // Only send keys that actually changed
    const changed: Record<string, string> = {};
    for (const field of this.allFields()) {
      if (this.isFieldDirty(field.key)) {
        changed[field.key] = this.values()[field.key] ?? '';
      }
    }

    this.isSaving.set(true);
    this.settingsService.adminSetMany(changed).subscribe({
      next: (res) => {
        this.serverValues.set({ ...res.settings });
        this.values.set({ ...res.settings });
        this.isSaving.set(false);
        this.toast.show('Settings saved');
      },
      error: (err) => {
        console.error('Save settings failed', err);
        this.isSaving.set(false);
        this.toast.show(err.error?.error || 'Failed to save settings');
      },
    });
  }

  private allFields(): SettingField[] {
    return this.groups.flatMap((g) => g.fields);
  }
}