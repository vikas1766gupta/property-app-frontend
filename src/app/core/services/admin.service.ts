import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface BusinessRecord {
  id: string;
  companyName: string;
  contactPhone: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  user: { email: string };
}

export interface RevenueRow {
  status: string;
  _sum: { amount: number | null };
  _count: number;
}

export interface PricingConfig {
  freeListingLimit: number;
  pricePerListing: number;
  currency: string;
}

export interface AdminListingRecord {
  id: string;
  title: string;
  city: string;
  price: number;
  currency: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  listBusinesses() {
    return this.http.get<BusinessRecord[]>(`${this.baseUrl}/businesses`);
  }

  verifyBusiness(id: string, status: 'VERIFIED' | 'REJECTED') {
    return this.http.patch<BusinessRecord>(`${this.baseUrl}/businesses/${id}/verify`, { status });
  }

  listAllListings() {
    return this.http.get<AdminListingRecord[]>(`${this.baseUrl}/listings`);
  }

  flagListing(id: string) {
    return this.http.patch<AdminListingRecord>(`${this.baseUrl}/listings/${id}/flag`, {});
  }

  removeListing(id: string) {
    return this.http.patch<AdminListingRecord>(`${this.baseUrl}/listings/${id}/remove`, {});
  }

  revenueReport() {
    return this.http.get<RevenueRow[]>(`${this.baseUrl}/reports/revenue`);
  }

  getPricing() {
    return this.http.get<PricingConfig>(`${this.baseUrl}/pricing`);
  }

  updatePricing(config: PricingConfig) {
    return this.http.patch<PricingConfig>(`${this.baseUrl}/pricing`, config);
  }
}
