import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Plan } from './subscription.service';

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

export interface SubscriptionReportRow {
  status: string;
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

export interface ReportRecord {
  id: string;
  entityType: 'BUSINESS' | 'PROPERTY' | 'PROJECT';
  entityId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  listBusinesses() {
    return this.http.get<BusinessRecord[]>(`${this.baseUrl}/businesses`);
  }

  verifyBusiness(id: string, status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED') {
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

  listReports() { return this.http.get<ReportRecord[]>(`${this.baseUrl}/reports`); }

  moderateReport(id: string, status: 'UNDER_REVIEW' | 'DISMISSED' | 'SUSPENDED' | 'REJECTED' | 'RESOLVED') { return this.http.patch<ReportRecord>(`${this.baseUrl}/reports/${id}`, { status }); }

  revenueReport() {
    return this.http.get<RevenueRow[]>(`${this.baseUrl}/reports/revenue`);
  }

  subscriptionReport() {
    return this.http.get<SubscriptionReportRow[]>(`${this.baseUrl}/reports/subscriptions`);
  }

  getPricing() {
    return this.http.get<PricingConfig>(`${this.baseUrl}/pricing`);
  }

  updatePricing(config: PricingConfig) {
    return this.http.patch<PricingConfig>(`${this.baseUrl}/pricing`, config);
  }

  listPlans() {
    return this.http.get<Plan[]>(`${this.baseUrl}/plans`);
  }

  createPlan(plan: Omit<Plan, 'id'>) {
    return this.http.post<Plan>(`${this.baseUrl}/plans`, plan);
  }

  updatePlan(id: string, plan: Partial<Plan>) {
    return this.http.patch<Plan>(`${this.baseUrl}/plans/${id}`, plan);
  }
}
