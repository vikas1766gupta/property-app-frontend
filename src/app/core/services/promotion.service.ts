import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export interface PromotionConfig {
  id: string;
  type: "FEATURED" | "PREMIUM" | "HOMEPAGE" | "SEARCH_PRIORITY";
  price: number;
  durationDays: number;
  allowedCustomerTypes: string[];
  priorityWeight: number;
  isActive: boolean;
}
export interface Promotion {
  id: string;
  propertyId: string | null;
  projectId: string | null;
  type: string;
  startAt: string;
  endAt: string;
  status: string;
  paymentId: string | null;
}

@Injectable({ providedIn: "root" })
export class PromotionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  configs() {
    return this.http.get<PromotionConfig[]>(
      `${this.baseUrl}/promotion-configs`,
    );
  }
  mine() {
    return this.http.get<Promotion[]>(`${this.baseUrl}/promotions/mine`);
  }
  purchase(
    targetType: "PROPERTY" | "PROJECT",
    targetId: string,
    type: PromotionConfig["type"],
  ) {
    return this.http.post<{
      promotion: Promotion;
      checkout: { clientSecret: string; paymentId: string } | null;
    }>(`${this.baseUrl}/promotions`, { targetType, targetId, type });
  }
}
