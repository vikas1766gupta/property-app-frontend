import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export type ReportReason =
  | "FAKE_PROPERTY"
  | "WRONG_PRICE"
  | "DUPLICATE"
  | "SPAM"
  | "SCAM"
  | "WRONG_INFORMATION"
  | "OTHER";

@Injectable({ providedIn: "root" })
export class TrustService {
  private readonly http = inject(HttpClient);
  report(input: {
    entityType: "BUSINESS" | "PROPERTY" | "PROJECT";
    entityId: string;
    reason: ReportReason;
    description: string;
  }) {
    return this.http.post(`${environment.apiUrl}/reports`, input);
  }
}
