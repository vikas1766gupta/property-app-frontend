import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property, PropertyImageInput, PropertyNotification, PropertySearchFilters, PropertySearchResult, SavedSearch, SavedSearchFilters } from '../../shared/models/property.model';

export interface UploadedPropertyImage {
  id: string;
  url: string;
}

type PropertyMutation = Omit<Partial<Property>, 'imageRefs'> & { imageRefs?: PropertyImageInput[] };

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

  uploadImage(file: File): Observable<HttpEvent<UploadedPropertyImage>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.request<UploadedPropertyImage>(new HttpRequest(
      'POST',
      `${this.baseUrl}/images/upload`,
      formData,
      { reportProgress: true },
    ));
  }

  create(payload: PropertyMutation): Observable<{ property: Property; requiresPayment: boolean }> {
    return this.http.post<{ property: Property; requiresPayment: boolean }>(this.baseUrl, payload);
  }

  update(id: string, payload: PropertyMutation): Observable<Property> {
    return this.http.patch<Property>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  freeListingsRemaining(): Observable<{ remaining: number }> {
    return this.http.get<{ remaining: number }>(`${this.baseUrl}/mine/free-remaining`);
  }

  listSavedSearches(): Observable<SavedSearch[]> {
    return this.http.get<SavedSearch[]>(`${this.baseUrl}/saved-searches`);
  }

  createSavedSearch(input: { name: string; filters: SavedSearchFilters; notifyOnMatch: boolean }): Observable<SavedSearch> {
    return this.http.post<SavedSearch>(`${this.baseUrl}/saved-searches`, input);
  }

  removeSavedSearch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/saved-searches/${id}`);
  }

  listNotifications(): Observable<PropertyNotification[]> {
    return this.http.get<PropertyNotification[]>(`${environment.apiUrl}/notifications`);
  }
}
