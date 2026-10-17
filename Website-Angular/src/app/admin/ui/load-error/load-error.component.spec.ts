import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { adminErrorDetail } from '../../admin-api';
import { T, type TranslationKey } from '../../../core/data/i18n.data';
import { I18nService } from '../../../core/services/i18n.service';
import { LoadErrorComponent } from './load-error.component';

describe('adminErrorDetail', () => {
  const cases: [string, unknown, string][] = [
    ['HTTP error body', new HttpErrorResponse({ error: { error: ' Backend error ' }, status: 500 }), 'Backend error'],
    ['error before message', { error: { error: 'First', message: 'Second' }, message: 'Third' }, 'First'],
    ['message body', { error: { message: ' Backend message ' }, message: 'Outer' }, 'Backend message'],
    ['plain Error', new Error(' Plain error '), 'Plain error'],
    ['string throw', ' String error ', 'String error'],
    ['null', null, T.en['admin.common.apiDown']],
    ['undefined', undefined, T.en['admin.common.apiDown']],
    ['empty object', {}, T.en['admin.common.apiDown']],
    ['blank message', { error: { error: ' ', message: '' }, message: ' ' }, T.en['admin.common.apiDown']],
  ];
  for (const [name, error, expected] of cases) {
    it(`extracts a non-empty message for ${name}`, () => {
      expect(adminErrorDetail(error)).toBe(expected);
    });
  }

  it('uses a localized fallback and never returns an empty fallback', () => {
    expect(adminErrorDetail(null, T.ar['admin.common.apiDown'])).toBe(T.ar['admin.common.apiDown']);
    expect(adminErrorDetail(null, ' ')).toBe(T.en['admin.common.apiDown']);
  });

  it('preserves the HttpErrorResponse message when no backend detail exists', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(adminErrorDetail(error)).toBe(error.message);
  });
});

describe('LoadErrorComponent', () => {
  const language = signal<'en' | 'ar'>('en');
  beforeEach(() => {
    language.set('en');
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: {
        t: (key: TranslationKey) => T[language()][key],
      } }],
    });
  });

  it('renders the shared localized default and reacts to a locale change', () => {
    const fixture = TestBed.createComponent(LoadErrorComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Failed to load');
    language.set('ar');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(T.ar['admin.common.loadFailed']);
    expect(fixture.nativeElement.textContent).toContain(T.ar['admin.common.tryAgain']);
  });

  it('accepts a custom title and hides an omitted detail', () => {
    const fixture = TestBed.createComponent(LoadErrorComponent);
    fixture.componentRef.setInput('title', 'Custom title');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Custom title');
    expect(fixture.debugElement.query(By.css('.load-error__detail'))).toBeNull();
  });

  it('renders details as text and exposes a native, keyboard-focusable retry button', () => {
    const fixture = TestBed.createComponent(LoadErrorComponent);
    fixture.componentRef.setInput('detail', '<script>not markup</script>');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const retry = jasmine.createSpy('retry');
    fixture.componentInstance.retry.subscribe(retry);
    expect(button.tabIndex).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    button.click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('disables retry and announces busy state while retrying', () => {
    const fixture = TestBed.createComponent(LoadErrorComponent);
    fixture.componentRef.setInput('retrying', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const retry = jasmine.createSpy('retry');
    fixture.componentInstance.retry.subscribe(retry);
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain(T.en['admin.common.retrying']);
    expect(fixture.nativeElement.querySelector('[role="alert"]').getAttribute('aria-busy')).toBe('true');
    button.click();
    expect(retry).not.toHaveBeenCalled();
  });
});
