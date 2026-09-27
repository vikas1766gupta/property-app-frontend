import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface LeadPayload {
  propertyId: string;
  name: string;
  contact: string;
  message: string;
}

export interface BusinessLead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leads`;

  submit(payload: LeadPayload) {
    return this.http.post(`${this.baseUrl}`, payload);
  }

  mine() {
    return this.http.get<BusinessLead[]>(`${this.baseUrl}/mine`);
  }
}
