import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { StorageService } from './storage.service';

/* =============================================================
   AUDIO
   The music is meant to start as soon as the page opens.

   Every current browser blocks sound that starts on its own —
   Chrome, Safari and Firefox all require a gesture first. So we
   do both: try to play immediately (which succeeds once the
   visitor has some history with the site), and if the browser
   refuses, start on the very first thing they do — a move, a
   scroll, a tap, a key. In practice that is under a second.

   If someone presses mute, that choice is remembered and the
   music will not start itself again.

   Ported unchanged from main.js's Audio_; only `paint()` is
   gone, replaced by the `wants` signal the sound button binds to.
   ============================================================= */

const GESTURES = [
  'pointerdown',
  'touchstart',
  'keydown',
  'wheel',
  'scroll',
  'mousemove',
] as const;

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly store = inject(StorageService);

  /** Whether the visitor wants music — what the button's `is-on` state shows. */
  readonly wants = signal(true);

  private el: HTMLAudioElement | null = null;
  /** True once playback has actually begun, as in main.js's Audio_. */
  private started = false;
  private armed = false;
  private fadeTimer: ReturnType<typeof setInterval> | undefined;

  /** Called once by the shell, with the <audio id="bp-audio"> element. */
  init(el: HTMLAudioElement): void {
    if (!this.isBrowser || this.el) return;
    this.el = el;

    el.volume = 0;
    el.loop = true;
    // muted by default is what lets some browsers begin at all;
    // we unmute the moment playback is actually running
    el.muted = false;

    // default ON, unless they turned it off on a previous visit
    this.wants.set(this.store.get('bp_sound') !== 'off');

    if (this.wants()) this.attempt();
  }

  /* try straight away; fall back to the first gesture */
  private attempt(): void {
    const el = this.el;
    if (!el) return;
    const p = el.play() as Promise<void> | undefined;
    if (p && typeof p.then === 'function') {
      p.then(() => {
        this.started = true;
        this.fade(0.28);
      }).catch(() => this.arm());
    } else {
      this.arm();
    }
  }

  /* almost anything counts as the gesture that unlocks audio */
  private arm(): void {
    if (this.armed) return;
    this.armed = true;

    const go = () => {
      GESTURES.forEach((ev) => removeEventListener(ev, go, true));
      this.armed = false;
      if (!this.wants()) return;
      this.el
        ?.play()
        .then(() => {
          this.started = true;
          this.fade(0.28);
        })
        .catch(() => {
          /* still blocked; leave it silent */
        });
    };
    GESTURES.forEach((ev) =>
      addEventListener(ev, go, { capture: true, once: true, passive: true }),
    );
  }

  toggle(): void {
    if (this.wants()) this.stop();
    else this.play();
  }

  play(): void {
    this.wants.set(true);
    this.store.set('bp_sound', 'on');
    this.el
      ?.play()
      .then(() => {
        this.started = true;
        this.fade(0.28);
      })
      .catch(() => this.arm());
  }

  stop(): void {
    this.wants.set(false);
    this.store.set('bp_sound', 'off');
    this.fade(0, () => this.el?.pause());
  }

  private fade(to: number, done?: () => void): void {
    const el = this.el;
    if (!el) return;
    const from = el.volume;
    const steps = 24;
    let i = 0;
    clearInterval(this.fadeTimer);
    this.fadeTimer = setInterval(() => {
      i++;
      el.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) {
        clearInterval(this.fadeTimer);
        done?.();
      }
    }, 25);
  }
}
