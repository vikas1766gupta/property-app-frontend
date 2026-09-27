import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Property } from '../../shared/models/property.model';

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
    return this.http.get<Property[]>(`${this.baseUrl}/listings`);
  }

  flagListing(id: string) {
    return this.http.patch<Property>(`${this.baseUrl}/listings/${id}/flag`, {});
  }

  removeListing(id: string) {
    return this.http.patch<Property>(`${this.baseUrl}/listings/${id}/remove`, {});
  }

  revenueReport() {
    return this.http.get<RevenueRow[]>(`${this.baseUrl}/reports/revenue`);
  }

  updatePricing(freeListingLimit: number, pricePerListing: number) {
    return this.http.patch(`${this.baseUrl}/pricing`, { freeListingLimit, pricePerListing });
  }
}
