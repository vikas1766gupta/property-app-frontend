import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
}

export interface PaymentRecord {
  id: string;
  propertyId: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  createdAt: string;
}

@Injectable({ providedIn: "root" })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  createIntent(propertyId: string) {
    return this.http.post<PaymentIntentResponse>(`${this.baseUrl}/intent`, {
      propertyId,
    });
  }

  history() {
    return this.http.get<PaymentRecord[]>(`${this.baseUrl}/history`);
  }
}
