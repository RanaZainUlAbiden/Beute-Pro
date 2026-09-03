import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { I18nService } from '../../core/services/i18n.service';

/* The floating WhatsApp corner. The href is still the placeholder the
   static site carries — the client has not supplied a number. */
@Component({
  selector: 'app-whatsapp-button',
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappButton {
  protected readonly i18n = inject(I18nService);
}
