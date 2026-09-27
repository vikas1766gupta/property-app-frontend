import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, BusinessRecord, RevenueRow } from '../../core/services/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { Property } from '../../shared/models/property.model';

type Tab = 'businesses' | 'listings' | 'revenue' | 'pricing';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanelComponent {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);

  readonly tab = signal<Tab>('businesses');
  readonly businesses = signal<BusinessRecord[]>([]);
  readonly listings = signal<Property[]>([]);
  readonly revenue = signal<RevenueRow[]>([]);
  readonly loading = signal(true);

  pricingForm = { freeListingLimit: 5, pricePerListing: 499 };
  readonly pricingSaved = signal(false);

  constructor() {
    this.loadTab('businesses');
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.loadTab(tab);
  }

  private loadTab(tab: Tab): void {
    this.loading.set(true);
    if (tab === 'businesses') {
      this.adminService.listBusinesses().subscribe((data) => {
        this.businesses.set(data);
        this.loading.set(false);
      });
    } else if (tab === 'listings') {
      this.adminService.listAllListings().subscribe((data) => {
        this.listings.set(data);
        this.loading.set(false);
      });
    } else if (tab === 'revenue') {
      this.adminService.revenueReport().subscribe((data) => {
        this.revenue.set(data);
        this.loading.set(false);
      });
    } else {
      this.loading.set(false);
    }
  }

  verify(business: BusinessRecord, status: 'VERIFIED' | 'REJECTED'): void {
    this.adminService.verifyBusiness(business.id, status).subscribe(() => this.loadTab('businesses'));
  }

  flag(listing: Property): void {
    this.adminService.flagListing(listing.id).subscribe(() => this.loadTab('listings'));
  }

  remove(listing: Property): void {
    if (!confirm('Remove this listing?')) return;
    this.adminService.removeListing(listing.id).subscribe(() => this.loadTab('listings'));
  }

  savePricing(): void {
    this.adminService
      .updatePricing(this.pricingForm.freeListingLimit, this.pricingForm.pricePerListing)
      .subscribe(() => {
        this.pricingSaved.set(true);
        setTimeout(() => this.pricingSaved.set(false), 2000);
      });
  }

  logout(): void {
    this.auth.logout();
    location.href = '/login';
  }
}
