import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export interface TopAnalyticsItem {
  id: string;
  name: string;
  views: number;
  enquiries: number;
  favorites?: number;
}
export interface BusinessAnalyticsSummary {
  range: { days: 7 | 30 | 90 };
  propertyViews: number;
  enquiries: number;
  contactActions: number;
  favorites: number;
  conversionToLead: number;
  topProperties: TopAnalyticsItem[];
}
export interface BuilderAnalyticsSummary {
  range: { days: 7 | 30 | 90 };
  projectViews: number;
  enquiries: number;
  enquiryConversion: number;
  topProjects: TopAnalyticsItem[];
}
export interface AdminAnalyticsSummary {
  range: { days: 7 | 30 | 90 };
  newUsers: number;
  activeListings: number;
  views: number;
  leads: number;
  subscriptions: number;
  revenue: number;
  cityDistribution: Array<{ label: string; count: number }>;
  propertyTypeDistribution: Array<{ label: string; count: number }>;
}

@Injectable({ providedIn: "root" })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  business(days: 7 | 30 | 90) {
    return this.http.get<BusinessAnalyticsSummary>(
      `${this.baseUrl}/businesses/me/analytics`,
      { params: { days } },
    );
  }
  builder(days: 7 | 30 | 90) {
    return this.http.get<BuilderAnalyticsSummary>(
      `${this.baseUrl}/businesses/me/analytics/projects`,
      { params: { days } },
    );
  }
  admin(days: 7 | 30 | 90) {
    return this.http.get<AdminAnalyticsSummary>(
      `${this.baseUrl}/admin/analytics`,
      { params: { days } },
    );
  }
  track(event: {
    event: string;
    propertyId?: string;
    projectId?: string;
    city?: string;
    propertyType?: string;
  }): void {
    this.http
      .post(`${this.baseUrl}/analytics/events`, event)
      .subscribe({ error: () => undefined });
  }
}
