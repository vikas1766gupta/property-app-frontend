import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  AdminListingRecord,
  AdminService,
  BusinessRecord,
  ReportRecord,
  RevenueRow,
  SubscriptionReportRow,
} from "../../core/services/admin.service";
import { AuthService } from "../../core/auth/auth.service";
import { UiButtonDirective } from "../../shared/ui/button.directive";
import { UiCardComponent } from "../../shared/ui/card.component";
import { UiEmptyStateComponent } from "../../shared/ui/empty-state.component";
import { UiInputDirective } from "../../shared/ui/input.directive";
import { UiSkeletonComponent } from "../../shared/ui/skeleton.component";
import { UiToastComponent } from "../../shared/ui/toast.component";
import { Plan } from "../../core/services/subscription.service";
import {
  AdminAnalyticsSummary,
  AnalyticsService,
} from "../../core/services/analytics.service";

type Tab =
  | "businesses"
  | "listings"
  | "reports"
  | "revenue"
  | "subscriptions"
  | "analytics"
  | "pricing"
  | "plans";

@Component({
  selector: "app-admin-panel",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonDirective,
    UiCardComponent,
    UiEmptyStateComponent,
    UiInputDirective,
    UiSkeletonComponent,
    UiToastComponent,
  ],
  templateUrl: "./admin-panel.component.html",
  styleUrl: "./admin-panel.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelComponent {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly tab = signal<Tab>("businesses");
  readonly businesses = signal<BusinessRecord[]>([]);
  readonly listings = signal<AdminListingRecord[]>([]);
  readonly reports = signal<ReportRecord[]>([]);
  readonly revenue = signal<RevenueRow[]>([]);
  readonly subscriptions = signal<SubscriptionReportRow[]>([]);
  readonly analytics = signal<AdminAnalyticsSummary | null>(null);
  readonly analyticsDays = signal<7 | 30 | 90>(30);
  readonly loading = signal(true);
  readonly viewError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  pricingForm = { freeListingLimit: 5, pricePerListing: 499, currency: "INR" };
  readonly pricingSaved = signal(false);
  readonly pricingError = signal<string | null>(null);
  readonly plans = signal<Plan[]>([]);
  readonly planError = signal<string | null>(null);
  planForm: Omit<Plan, "id"> = {
    name: "",
    accountType: null,
    price: 0,
    currency: "INR",
    billingInterval: "MONTHLY",
    maxActiveListings: 5,
    featuredCredits: 0,
    maxTeamMembers: 1,
    leadManagement: false,
    analytics: false,
    priorityVisibility: false,
    profileVisibility: true,
    projectListingAccess: false,
    isActive: true,
  };

  constructor() {
    this.loadTab("businesses");
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.loadTab(tab);
  }

  setAnalyticsDays(days: 7 | 30 | 90): void {
    this.analyticsDays.set(days);
    this.loadTab("analytics");
  }

  private loadTab(tab: Tab): void {
    this.loading.set(true);
    this.pricingError.set(null);
    this.planError.set(null);
    this.viewError.set(null);
    if (tab === "businesses") {
      this.adminService.listBusinesses().subscribe({
        next: (data) => {
          this.businesses.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set("Businesses could not be loaded.");
          this.loading.set(false);
        },
      });
    } else if (tab === "listings") {
      this.adminService.listAllListings().subscribe({
        next: (data) => {
          this.listings.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set("Listings could not be loaded.");
          this.loading.set(false);
        },
      });
    } else if (tab === "revenue") {
      this.adminService.revenueReport().subscribe({
        next: (data) => {
          this.revenue.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set("Revenue report could not be loaded.");
          this.loading.set(false);
        },
      });
    } else if (tab === "reports") {
      this.adminService.listReports().subscribe({
        next: (data) => {
          this.reports.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set("Reports could not be loaded.");
          this.loading.set(false);
        },
      });
    } else if (tab === "subscriptions") {
      this.adminService.subscriptionReport().subscribe({
        next: (data) => {
          this.subscriptions.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set("Subscription report could not be loaded.");
          this.loading.set(false);
        },
      });
    } else if (tab === "analytics") {
      this.analyticsService.admin(this.analyticsDays()).subscribe({
        next: (data) => {
          this.analytics.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set("Analytics could not be loaded.");
          this.loading.set(false);
        },
      });
    } else if (tab === "pricing") {
      this.adminService.getPricing().subscribe({
        next: (config) => {
          this.pricingForm = { ...config };
          this.loading.set(false);
        },
        error: (error) => {
          this.pricingError.set(
            error.error?.error || "Could not load pricing configuration.",
          );
          this.loading.set(false);
        },
      });
    } else if (tab === "plans") {
      this.adminService.listPlans().subscribe({
        next: (plans) => {
          this.plans.set(plans);
          this.loading.set(false);
        },
        error: () => {
          this.planError.set("Plans could not be loaded.");
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  moderateReport(
    report: ReportRecord,
    status:
      "UNDER_REVIEW" | "DISMISSED" | "SUSPENDED" | "REJECTED" | "RESOLVED",
  ): void {
    this.adminService
      .moderateReport(report.id, status)
      .subscribe({
        next: () => this.loadTab("reports"),
        error: () => this.actionError.set("Report could not be updated."),
      });
  }

  verify(business: BusinessRecord, status: "VERIFIED" | "REJECTED"): void {
    this.actionError.set(null);
    this.adminService.verifyBusiness(business.id, status).subscribe({
      next: () => this.loadTab("businesses"),
      error: () =>
        this.actionError.set("Business status could not be updated."),
    });
  }

  flag(listing: AdminListingRecord): void {
    this.actionError.set(null);
    this.adminService.flagListing(listing.id).subscribe({
      next: () => this.loadTab("listings"),
      error: () => this.actionError.set("Listing could not be flagged."),
    });
  }

  remove(listing: AdminListingRecord): void {
    if (!confirm("Remove this listing?")) return;
    this.actionError.set(null);
    this.adminService.removeListing(listing.id).subscribe({
      next: () => this.loadTab("listings"),
      error: () => this.actionError.set("Listing could not be removed."),
    });
  }

  savePricing(): void {
    this.adminService.updatePricing(this.pricingForm).subscribe({
      next: (config) => {
        this.pricingForm = { ...config };
        this.pricingError.set(null);
        this.pricingSaved.set(true);
        setTimeout(() => this.pricingSaved.set(false), 2000);
      },
      error: (error) =>
        this.pricingError.set(
          error.error?.error || "Could not save pricing configuration.",
        ),
    });
  }

  savePlan(): void {
    this.planError.set(null);
    const request = this.planForm.name
      ? this.adminService.createPlan(this.planForm)
      : null;
    request?.subscribe({
      next: () => {
        this.planForm = { ...this.planForm, name: "" };
        this.loadTab("plans");
      },
      error: (error) =>
        this.planError.set(error.error?.error || "Plan could not be created."),
    });
  }

  togglePlan(plan: Plan): void {
    this.adminService
      .updatePlan(plan.id, { isActive: !plan.isActive })
      .subscribe({
        next: () => this.loadTab("plans"),
        error: () => this.planError.set("Plan status could not be updated."),
      });
  }

  editPlan(plan: Plan): void {
    const price = Number(
      window.prompt(`Price for ${plan.name}`, String(plan.price)),
    );
    if (!Number.isFinite(price) || price < 0) return;
    this.adminService
      .updatePlan(plan.id, { price })
      .subscribe({
        next: () => this.loadTab("plans"),
        error: () => this.planError.set("Plan could not be updated."),
      });
  }

  logout(): void {
    this.auth.logout();
    location.href = "/login";
  }
}
