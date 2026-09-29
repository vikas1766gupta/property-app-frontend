import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "ui-modal",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="ui-modal-backdrop"
      *ngIf="open"
      (click)="onBackdropClick($event)"
    >
      <section
        class="ui-modal-panel"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="labelledBy"
      >
        <ng-content />
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .ui-modal-backdrop {
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        overflow-y: auto;
        padding: var(--space-4);
        background: rgb(18 38 30 / 58%);
      }

      .ui-modal-panel {
        width: min(100%, 34rem);
        max-height: min(90vh, 52rem);
        overflow-y: auto;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        box-shadow: var(--shadow-overlay);
      }
    `,
  ],
})
export class UiModalComponent {
  @Input() open = false;
  @Input() labelledBy = "";
  @Output() readonly closed = new EventEmitter<void>();

  @HostListener("document:keydown.escape") onEscape(): void {
    if (this.open) this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }
}
