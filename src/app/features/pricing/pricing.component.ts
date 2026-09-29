import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import {
  SubscriptionService,
  Plan,
} from "../../core/services/subscription.service";

@Component({
  selector: "app-pricing",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./pricing.component.html",
  styleUrl: "./pricing.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent implements OnInit {
  private readonly subscriptions = inject(SubscriptionService);
  readonly plans = signal<Plan[]>([]);
  readonly selectedPlanId = signal<string | null>(null);
  readonly currentPlanId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly message = signal("");

  ngOnInit(): void {
    this.subscriptions
      .plans()
      .subscribe({
        next: (plans) => this.plans.set(Array.isArray(plans) ? plans : []),
        error: () =>
          this.error.set("Plans could not be loaded. Please try again."),
      })
      .add(() => this.loading.set(false));
    this.subscriptions
      .entitlements()
      .subscribe({
        next: (entitlements) => this.currentPlanId.set(entitlements.id),
        error: () => undefined,
      });
  }

  select(plan: Plan): void {
    if (plan.id === this.currentPlanId()) return;
    this.selectedPlanId.set(plan.id);
    this.message.set("");
    this.subscriptions.subscribe(plan.id).subscribe({
      next: (result: any) => {
        if (plan.price === 0) this.currentPlanId.set(plan.id);
        this.message.set(
          result?.checkout
            ? "Your plan is ready. Complete payment from the dashboard to activate it."
            : "Plan activated.",
        );
        this.selectedPlanId.set(null);
      },
      error: (error) => {
        this.selectedPlanId.set(null);
        this.message.set(error.error?.message ?? "Unable to change plan.");
      },
    });
  }

  featureValue(
    plan: Plan,
    feature:
      | "listings"
      | "featured"
      | "team"
      | "leadManagement"
      | "analytics"
      | "priorityVisibility"
      | "projectListingAccess",
  ): string {
    if (feature === "listings") return `${plan.maxActiveListings}`;
    if (feature === "featured") return `${plan.featuredCredits}`;
    if (feature === "team") return `${plan.maxTeamMembers}`;
    return plan[feature] ? "Included" : "—";
  }
}
