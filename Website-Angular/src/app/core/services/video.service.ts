import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AudioService } from './audio.service';

/* =============================================================
   CLICK-TO-PLAY VIDEO REGISTRY

   Every <app-video-figure> on the page registers its <video>
   here, so the whole site shares:

     · one IntersectionObserver — the same rule MotionService
       follows, one observer for the app rather than one per
       element. A clip that scrolls out of view pauses itself.
     · one "currently playing" slot, so starting a second clip
       stops the first. Two factory floors talking over each
       other is never what anyone wanted.
     · the background oud, ducked to silence while a clip plays
       and faded back when it stops. The visitor's own on/off
       choice is untouched — see AudioService.duck().

   Nothing here starts playback. Every clip waits for a click.
   ============================================================= */
@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly audio = inject(AudioService);

  private io: IntersectionObserver | null = null;
  private current: HTMLVideoElement | null = null;

  private observer(): IntersectionObserver | null {
    if (!this.isBrowser) return null;
    this.io ??= new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const v = en.target as HTMLVideoElement;
          if (!en.isIntersecting && !v.paused) v.pause();
        }
      },
      { threshold: 0 },
    );
    return this.io;
  }

  /** Watch a clip so it pauses itself once it leaves the viewport. */
  watch(v: HTMLVideoElement): void {
    this.observer()?.observe(v);
  }

  unwatch(v: HTMLVideoElement): void {
    this.io?.unobserve(v);
    this.released(v);
  }

  /* A clip has started: stop whatever else was running, duck the oud.
     pause() below fires its own `pause` event on a later task, so the
     old clip's released() call arrives after `current` has moved on
     and is correctly ignored. */
  claim(v: HTMLVideoElement): void {
    if (this.current && this.current !== v) this.current.pause();
    this.current = v;
    this.audio.duck();
  }

  /** A clip paused, ended, or left the page. */
  released(v: HTMLVideoElement): void {
    if (this.current !== v) return;
    this.current = null;
    this.audio.unduck();
  }
}
