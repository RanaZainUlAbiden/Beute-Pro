import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { AdminApi, adminDate, type Customer } from '../admin-api';
import { ConfirmDialog } from '../ui/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';

type SortKey = 'full_name' | 'email' | 'created_at' | 'order_count';

/** Pakistani mobile numbers only: 03xxxxxxxxx or +923xxxxxxxxx (spaces/dashes ignored) — the same rule signup uses. */
const PK_PHONE = /^(?:0|\+92)3\d{9}$/;

function pkPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString().trim();
  if (!value) return null; // Validators.required already covers empty
  return PK_PHONE.test(value.replace(/[\s-]/g, '')) ? null : { pkPhone: true };
}

/* =============================================================
   CUSTOMERS (admin)

   Registered accounts, not orders — a customer with zero orders
   still shows up (the list is a LEFT JOIN on the backend). Search
   and sort are the server's, not the page's: unlike Orders, this
   table is expected to grow past what one page can hold, so both
   run in SQL and the count line always reflects the whole table.

   Deleting is schema-safe (see customerService.js on the backend):
   orders.user_id is `ON DELETE SET NULL` and every order also
   snapshots the customer's name/email/phone/address at checkout,
   so removing the account cannot orphan an order — it just stops
   being linked to one. The confirm dialog says so when it matters.
   ============================================================= */
@Component({
  selector: 'app-admin-customers',
  imports: [ReactiveFormsModule, ConfirmDialog],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss',
})
export class AdminCustomersComponent implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(I18nService);

  protected readonly date = adminDate;

  protected readonly customers = signal<readonly Customer[]>([]);
  protected readonly busy = signal(true);
  protected readonly failed = signal(false);

  protected readonly page = signal(1);
  protected readonly limit = 20;
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);

  protected readonly search = signal('');
  protected readonly sortKey = signal<SortKey>('created_at');
  protected readonly sortDesc = signal(true);
  private searchTimer?: ReturnType<typeof setTimeout>;

  /** The customer being edited, and the form behind the dialog. */
  protected readonly editing = signal<Customer | null>(null);
  protected readonly editForm: FormGroup;
  protected readonly savingEdit = signal(false);
  protected readonly editError = signal('');

  /** The customer waiting on the delete confirm dialog. */
  protected readonly pendingDelete = signal<Customer | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    this.editForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, pkPhoneValidator]],
      address: ['', [Validators.required, Validators.minLength(5)]],
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .customers(this.page(), this.limit, this.search().trim() || undefined, this.sortKey(), this.sortDesc() ? 'desc' : 'asc')
      .subscribe({
        next: (res) => {
          this.customers.set(res.customers ?? []);
          this.total.set(res.total ?? 0);
          this.totalPages.set(Math.max(1, res.totalPages ?? 1));
          this.busy.set(false);
        },
        error: () => {
          this.busy.set(false);
          this.failed.set(true);
        },
      });
  }

  /** Debounced so every keystroke doesn't round-trip to the server. */
  protected onSearchInput(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 350);
  }

  protected clearSearch(): void {
    clearTimeout(this.searchTimer);
    this.search.set('');
    this.page.set(1);
    this.load();
  }

  protected goto(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDesc.update((v) => !v);
    } else {
      this.sortKey.set(key);
      this.sortDesc.set(key === 'created_at' || key === 'order_count');
    }
    this.page.set(1);
    this.load();
  }

  protected sortState(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDesc() ? 'descending' : 'ascending';
  }

  protected openEdit(customer: Customer): void {
    this.editError.set('');
    this.editing.set(customer);
    this.editForm.reset({
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone ?? '',
      address: customer.address ?? '',
    });
  }

  protected closeEdit(): void {
    if (this.savingEdit()) return;
    this.editing.set(null);
  }

  protected showError(name: string): boolean {
    const c = this.editForm.get(name);
    return !!c && c.invalid && c.touched;
  }

  protected errorFor(name: string): string {
    const c = this.editForm.get(name);
    if (!c || c.valid) return '';
    switch (name) {
      case 'full_name':
        return this.i18n.t('admin.customers.errName');
      case 'email':
        return this.i18n.t('admin.customers.errEmail');
      case 'phone':
        return this.i18n.t('admin.customers.errPhone');
      case 'address':
        return this.i18n.t('admin.customers.errAddress');
      default:
        return '';
    }
  }

  protected saveEdit(): void {
    const customer = this.editing();
    if (!customer || this.savingEdit()) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.savingEdit.set(true);
    this.editError.set('');
    this.api.updateCustomer(customer.id, this.editForm.value).subscribe({
      next: (res) => {
        this.savingEdit.set(false);
        this.editing.set(null);
        this.customers.update((list) =>
          list.map((c) => (c.id === customer.id ? { ...c, ...res.customer } : c)),
        );
        this.toast.show(this.i18n.t('admin.customers.saved'));
      },
      error: (err: HttpErrorResponse) => {
        this.savingEdit.set(false);
        this.editError.set(
          err.status === 409 ? this.i18n.t('admin.customers.errEmailTaken') : this.i18n.t('admin.customers.saveErr'),
        );
      },
    });
  }

  protected confirmDelete(): void {
    const customer = this.pendingDelete();
    if (!customer) return;
    this.deleting.set(true);
    this.api.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.show(this.i18n.t('admin.customers.deletedNote'));
        // the page it came from may now be short a row
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toast.show(this.i18n.t('admin.customers.deleteErr'));
      },
    });
  }

  /** The delete confirm's body — different wording once orders are on the line. */
  protected deleteBody(customer: Customer): string {
    return customer.order_count > 0
      ? this.i18n.t('admin.customers.deleteBodyWithOrders').replace('{count}', String(customer.order_count))
      : this.i18n.t('admin.customers.deleteBodyNoOrders');
  }
}
