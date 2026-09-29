import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export interface SeoLocationPage {
  slug: string;
  name: string;
  title: string;
  intro: string;
  canonicalPath: string;
  noindex: boolean;
  total: number;
  averagePrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  popularPropertyTypes: Array<{ type: string; count: number }>;
  popularLocalities: string[];
  listings: Array<{
    id: string;
    title: string;
    city: string;
    price: number;
    currency: string;
    listingType: string;
  }>;
}

@Injectable({ providedIn: "root" })
export class SeoService {
  private readonly http = inject(HttpClient);
  getLocation(slug: string) {
    return this.http.get<SeoLocationPage>(
      `${environment.apiUrl}/seo/locations/${slug}`,
    );
  }
}
