import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BusinessProfile, BusinessProfileUpdate, BusinessPropertySummary } from '../../shared/models/business.model';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/businesses`;

  getById(id: string): Observable<BusinessProfile> {
    return this.http.get<BusinessProfile>(`${this.baseUrl}/${id}`);
  }

  list(): Observable<BusinessProfile[]> {
    return this.http.get<BusinessProfile[]>(this.baseUrl);
  }

  updateMine(input: BusinessProfileUpdate): Observable<BusinessProfile> {
    return this.http.patch<BusinessProfile>(`${this.baseUrl}/me`, input);
  }

  properties(id: string): Observable<BusinessPropertySummary[]> {
    return this.http.get<BusinessPropertySummary[]>(`${this.baseUrl}/${id}/properties`);
  }
}
