import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property, PropertySearchFilters, PropertySearchResult } from '../../shared/models/property.model';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/properties`;

  search(filters: PropertySearchFilters): Observable<PropertySearchResult> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
    return this.http.get<PropertySearchResult>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.baseUrl}/${id}`);
  }

  myListings(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.baseUrl}/mine/all`);
  }

  create(payload: Partial<Property>): Observable<{ property: Property; requiresPayment: boolean }> {
    return this.http.post<{ property: Property; requiresPayment: boolean }>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<Property>): Observable<Property> {
    return this.http.patch<Property>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  freeListingsRemaining(): Observable<{ remaining: number }> {
    return this.http.get<{ remaining: number }>(`${this.baseUrl}/mine/free-remaining`);
  }
}
