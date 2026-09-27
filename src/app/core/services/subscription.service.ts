import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Plan {
  id: string;
  name: string;
  accountType: 'OWNER' | 'BROKER' | 'BUILDER' | null;
  price: number;
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  maxActiveListings: number;
  featuredCredits: number;
  maxTeamMembers: number;
  leadManagement: boolean;
  analytics: boolean;
  priorityVisibility: boolean;
  profileVisibility: boolean;
  projectListingAccess: boolean;
  isActive: boolean;
}

export interface Entitlements extends Plan {
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd?: string;
  listingUsage: number;
  listingLimitReached: boolean;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  plans() { return this.http.get<Plan[]>(`${this.baseUrl}/plans`); }
  current() { return this.http.get<unknown>(`${this.baseUrl}/subscriptions/me`); }
  subscribe(planId: string) { return this.http.post<unknown>(`${this.baseUrl}/subscriptions`, { planId }); }
  cancel(id: string) { return this.http.post<unknown>(`${this.baseUrl}/subscriptions/${id}/cancel`, {}); }
  history() { return this.http.get<unknown[]>(`${this.baseUrl}/subscriptions/history`); }
  entitlements() { return this.http.get<Entitlements>(`${this.baseUrl}/entitlements/me`); }
}
