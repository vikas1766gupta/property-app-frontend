import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminListingRecord, AdminService, BusinessRecord, RevenueRow } from '../../core/services/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { UiButtonDirective } from '../../shared/ui/button.directive';
import { UiCardComponent } from '../../shared/ui/card.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state.component';
import { UiInputDirective } from '../../shared/ui/input.directive';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';
import { UiToastComponent } from '../../shared/ui/toast.component';

type Tab = 'businesses' | 'listings' | 'revenue' | 'pricing';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonDirective, UiCardComponent, UiEmptyStateComponent, UiInputDirective, UiSkeletonComponent, UiToastComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelComponent {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);

  readonly tab = signal<Tab>('businesses');
  readonly businesses = signal<BusinessRecord[]>([]);
  readonly listings = signal<AdminListingRecord[]>([]);
  readonly revenue = signal<RevenueRow[]>([]);
  readonly loading = signal(true);
  readonly viewError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  pricingForm = { freeListingLimit: 5, pricePerListing: 499, currency: 'INR' };
  readonly pricingSaved = signal(false);
  readonly pricingError = signal<string | null>(null);

  constructor() {
    this.loadTab('businesses');
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.loadTab(tab);
  }

  private loadTab(tab: Tab): void {
    this.loading.set(true);
    this.pricingError.set(null);
    this.viewError.set(null);
    if (tab === 'businesses') {
      this.adminService.listBusinesses().subscribe({
        next: (data) => {
          this.businesses.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set('Businesses could not be loaded.');
          this.loading.set(false);
        },
      });
    } else if (tab === 'listings') {
      this.adminService.listAllListings().subscribe({
        next: (data) => {
          this.listings.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set('Listings could not be loaded.');
          this.loading.set(false);
        },
      });
    } else if (tab === 'revenue') {
      this.adminService.revenueReport().subscribe({
        next: (data) => {
          this.revenue.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.viewError.set('Revenue report could not be loaded.');
          this.loading.set(false);
        },
      });
    } else if (tab === 'pricing') {
      this.adminService.getPricing().subscribe({
        next: (config) => {
          this.pricingForm = { ...config };
          this.loading.set(false);
        },
        error: (error) => {
          this.pricingError.set(error.error?.error || 'Could not load pricing configuration.');
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  verify(business: BusinessRecord, status: 'VERIFIED' | 'REJECTED'): void {
    this.actionError.set(null);
    this.adminService.verifyBusiness(business.id, status).subscribe({
      next: () => this.loadTab('businesses'),
      error: () => this.actionError.set('Business status could not be updated.'),
    });
  }

  flag(listing: AdminListingRecord): void {
    this.actionError.set(null);
    this.adminService.flagListing(listing.id).subscribe({
      next: () => this.loadTab('listings'),
      error: () => this.actionError.set('Listing could not be flagged.'),
    });
  }

  remove(listing: AdminListingRecord): void {
    if (!confirm('Remove this listing?')) return;
    this.actionError.set(null);
    this.adminService.removeListing(listing.id).subscribe({
      next: () => this.loadTab('listings'),
      error: () => this.actionError.set('Listing could not be removed.'),
    });
  }

  savePricing(): void {
    this.adminService
      .updatePricing(this.pricingForm)
      .subscribe({
        next: (config) => {
          this.pricingForm = { ...config };
          this.pricingError.set(null);
          this.pricingSaved.set(true);
          setTimeout(() => this.pricingSaved.set(false), 2000);
        },
        error: (error) => this.pricingError.set(error.error?.error || 'Could not save pricing configuration.'),
      });
  }

  logout(): void {
    this.auth.logout();
    location.href = '/login';
  }
}
