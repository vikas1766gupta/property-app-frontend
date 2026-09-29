import { ChangeDetectionStrategy, Component, Input } from "@angular/core";

@Component({
  selector: "ui-empty-state",
  standalone: true,
  template: `
    <section class="ui-empty-state" [attr.aria-labelledby]="titleId">
      <span class="ui-empty-state__mark" aria-hidden="true">{{ mark }}</span>
      <h2 [id]="titleId">{{ title }}</h2>
      <p>{{ description }}</p>
      <div class="ui-empty-state__actions"><ng-content /></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .ui-empty-state {
        display: grid;
        justify-items: center;
        gap: var(--space-2);
        padding: clamp(var(--space-6), 8vw, var(--space-9));
        border: 1px dashed var(--color-line-strong);
        border-radius: var(--radius-md);
        color: var(--color-muted);
        background: var(--color-surface-soft);
        text-align: center;
      }
      .ui-empty-state__mark {
        color: var(--color-brand);
        font-size: 1.65rem;
      }
      h2 {
        margin: 0;
        color: var(--color-ink);
        font: 600 var(--text-lg) var(--font-display);
      }
      p {
        max-width: 34rem;
        margin: 0;
        font-size: var(--text-sm);
        line-height: 1.55;
      }
      .ui-empty-state__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }
    `,
  ],
})
export class UiEmptyStateComponent {
  private static sequence = 0;
  readonly titleId = `ui-empty-state-${UiEmptyStateComponent.sequence++}`;
  @Input() title = "Nothing here yet";
  @Input() description = "";
  @Input() mark = "⌂";
}
