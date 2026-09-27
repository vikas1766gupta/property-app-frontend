import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiToastTone = 'success' | 'error' | 'info';

@Component({
  selector: 'ui-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible && message" class="ui-toast" [class.ui-toast--success]="tone === 'success'"
      [class.ui-toast--error]="tone === 'error'" [class.ui-toast--info]="tone === 'info'"
      [attr.role]="tone === 'error' ? 'alert' : 'status'" aria-live="polite">
      {{ message }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .ui-toast {
      margin-block: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-line);
      border-left: 4px solid var(--color-info);
      border-radius: var(--radius-sm);
      color: var(--color-ink);
      background: var(--color-surface-soft);
      font-size: var(--text-sm);
    }

    .ui-toast--success { border-left-color: var(--color-success); }
    .ui-toast--error { border-left-color: var(--color-danger); color: var(--color-danger-ink); background: var(--color-danger-soft); }
    .ui-toast--info { border-left-color: var(--color-info); }
  `],
})
export class UiToastComponent {
  @Input() message: string | null = null;
  @Input() tone: UiToastTone = 'info';
  @Input() visible = true;
}