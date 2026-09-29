import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

export type UiSkeletonVariant = "text" | "row" | "card" | "detail";

@Component({
  selector: "ui-skeleton",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-skeleton-list" [attr.aria-label]="label" aria-live="polite">
      <span class="sr-only">{{ label }}</span>
      <div
        *ngFor="let item of items"
        class="ui-skeleton"
        [class.ui-skeleton--text]="variant === 'text'"
        [class.ui-skeleton--row]="variant === 'row'"
        [class.ui-skeleton--card]="variant === 'card'"
        [class.ui-skeleton--detail]="variant === 'detail'"
        aria-hidden="true"
      ></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: contents;
      }
      .ui-skeleton-list {
        display: contents;
      }
      .ui-skeleton {
        position: relative;
        overflow: hidden;
        border-radius: var(--radius-sm);
        background: var(--color-skeleton);
      }
      .ui-skeleton::after {
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
          90deg,
          transparent,
          rgb(255 255 255 / 62%),
          transparent
        );
        animation: ui-skeleton-sweep 1.35s ease-in-out infinite;
        content: "";
      }
      .ui-skeleton--text {
        width: min(100%, 15rem);
        height: 0.8rem;
        margin-block: var(--space-2);
      }
      .ui-skeleton--row {
        width: 100%;
        height: 2.8rem;
        margin-block: var(--space-2);
      }
      .ui-skeleton--card {
        min-height: 16rem;
        aspect-ratio: 3 / 4;
      }
      .ui-skeleton--detail {
        width: 100%;
        min-height: 18rem;
        aspect-ratio: 4 / 3;
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }
      @keyframes ui-skeleton-sweep {
        to {
          transform: translateX(100%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ui-skeleton::after {
          animation: none;
        }
      }
    `,
  ],
})
export class UiSkeletonComponent {
  @Input() variant: UiSkeletonVariant = "text";
  @Input() count = 1;
  @Input() label = "Loading";

  get items(): number[] {
    return Array.from({ length: Math.max(1, this.count) }, (_, index) => index);
  }
}
