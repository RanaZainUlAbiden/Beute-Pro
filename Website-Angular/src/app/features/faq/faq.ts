import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { TranslationKey } from '../../core/data/i18n.data';
import { AccordionPanelDirective } from '../../core/directives/accordion-panel.directive';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { I18nService } from '../../core/services/i18n.service';
import { PageBanner } from '../../shared/page-banner/page-banner';
import { SplitHeading, type SplitSegment } from '../../shared/split-heading/split-heading';

/** A link rendered under an answer. */
interface FaqLink {
  readonly label: TranslationKey;
  readonly route: string;
  readonly fragment?: string;
}

interface FaqItem {
  /** Stable id. The open-panel signal and the DOM ids both key off it. */
  readonly id: string;
  readonly q: TranslationKey;
  /** One key per paragraph, so an answer can run to two without a second shape. */
  readonly a: readonly TranslationKey[];
  readonly link?: FaqLink;
}

interface FaqGroup {
  readonly id: string;
  readonly title: TranslationKey;
  readonly items: readonly FaqItem[];
}

/* The questions themselves. Only ids and key names live here; every
   word is in core/data/i18n.data.ts, in both languages. */
const GROUPS: readonly FaqGroup[] = [
  {
    id: 'use',
    title: 'faq.g.use',
    items: [
      { id: 'q-results', q: 'faq.use.results.q', a: ['faq.use.results.a', 'faq.use.results.a2'] },
      { id: 'q-patch', q: 'faq.use.patch.q', a: ['faq.use.patch.a', 'faq.use.patch.a2'] },
      { id: 'q-ampm', q: 'faq.use.ampm.q', a: ['faq.use.ampm.a', 'faq.use.ampm.a2'] },
      { id: 'q-order', q: 'faq.use.order.q', a: ['faq.use.order.a', 'faq.use.order.a2'] },
      {
        id: 'q-alongside',
        q: 'faq.use.alongside.q',
        a: ['faq.use.alongside.a', 'faq.use.alongside.a2'],
      },
    ],
  },
  {
    id: 'herbal',
    title: 'faq.g.herb',
    items: [
      { id: 'q-batch', q: 'faq.herb.batch.q', a: ['faq.herb.batch.a', 'faq.herb.batch.a2'] },
      { id: 'q-vs', q: 'faq.herb.vs.q', a: ['faq.herb.vs.a', 'faq.herb.vs.a2'] },
      {
        id: 'q-coldpressed',
        q: 'faq.herb.coldpressed.q',
        a: ['faq.herb.coldpressed.a', 'faq.herb.coldpressed.a2'],
      },
      { id: 'q-purge', q: 'faq.herb.purge.q', a: ['faq.herb.purge.a', 'faq.herb.purge.a2'] },
    ],
  },
  {
    id: 'safety',
    title: 'faq.g.safe',
    items: [
      {
        id: 'q-pregnancy',
        q: 'faq.safe.pregnancy.q',
        a: ['faq.safe.pregnancy.a', 'faq.safe.pregnancy.a2'],
      },
      {
        id: 'q-sensitive',
        q: 'faq.safe.sensitive.q',
        a: ['faq.safe.sensitive.a', 'faq.safe.sensitive.a2'],
      },
      {
        id: 'q-reaction',
        q: 'faq.safe.reaction.q',
        a: ['faq.safe.reaction.a', 'faq.safe.reaction.a2'],
      },
      {
        id: 'q-children',
        q: 'faq.safe.children.q',
        a: ['faq.safe.children.a', 'faq.safe.children.a2'],
      },
    ],
  },
  {
    id: 'storage',
    title: 'faq.g.store',
    items: [
      { id: 'q-store', q: 'faq.store.how.q', a: ['faq.store.how.a', 'faq.store.how.a2'] },
      { id: 'q-shelf', q: 'faq.store.shelf.q', a: ['faq.store.shelf.a', 'faq.store.shelf.a2'] },
      {
        id: 'q-batchno',
        q: 'faq.store.batch.q',
        a: ['faq.store.batch.a', 'faq.store.batch.a2'],
      },
    ],
  },
  {
    id: 'brand',
    title: 'faq.g.brand',
    items: [
      { id: 'q-halal', q: 'faq.brand.halal.q', a: ['faq.brand.halal.a'] },
      { id: 'q-cruelty', q: 'faq.brand.cruelty.q', a: ['faq.brand.cruelty.a'] },
      { id: 'q-ingredients', q: 'faq.brand.ingredients.q', a: ['faq.brand.ingredients.a'] },
      {
        id: 'q-returns',
        q: 'faq.brand.returns.q',
        a: ['faq.brand.returns.a'],
        link: { label: 'faq.brand.returns.link', route: '/policies', fragment: 'returns' },
      },
    ],
  },
];

/* =============================================================
   FAQ

   Twenty questions in five groups, as one accordion: `open` holds
   a single id, so opening any question closes whichever was open,
   across groups as well as within one. The first question of the
   first group starts open, and does so in the prerendered HTML
   too — the .is-open max-height cap in styles.scss covers the gap
   before AccordionPanelDirective measures the real height.

   Keyboard: the buttons are buttons, so Tab, Enter and Space come
   free. Up/Down/Home/End move between questions on top of that,
   the APG accordion pattern. Arrows are vertical, so nothing here
   needs mirroring in Arabic.

   A closed panel keeps its answer in the DOM — that is what the
   prerender ships to a crawler — but is marked `inert`, so its
   text and its one link are out of the tab order and out of the
   screen-reader tree until it opens.
   ============================================================= */
@Component({
  selector: 'app-faq',
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RevealDirective, AccordionPanelDirective, SplitHeading, PageBanner],
})
export class Faq {
  protected readonly i18n = inject(I18nService);

  protected readonly groups = GROUPS;

  protected readonly heroTitle = computed<SplitSegment[]>(() => [
    { text: this.i18n.t('faq.t1') },
    { text: this.i18n.t('faq.t2'), class: 'accent' },
  ]);

  /** The one open question. Empty string means every panel is closed. */
  private readonly open = signal<string>(GROUPS[0].items[0].id);

  protected isOpen(id: string): boolean {
    return this.open() === id;
  }

  protected toggle(id: string): void {
    this.open.update((current) => (current === id ? '' : id));
  }

  /** Up/Down/Home/End between the question buttons. */
  protected navigate(event: KeyboardEvent): void {
    const step =
      event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    const jump = event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : null;
    if (!step && !jump) return;

    const root = event.currentTarget as HTMLElement;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('.acc__btn'));
    const from = buttons.indexOf(event.target as HTMLButtonElement);
    if (from === -1) return; // the focus is on a link inside a panel, not a question

    event.preventDefault();
    const to =
      jump === 'first'
        ? 0
        : jump === 'last'
          ? buttons.length - 1
          : (from + step + buttons.length) % buttons.length;
    buttons[to].focus();
  }
}
