import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface LeadPayload {
  propertyId: string;
  name: string;
  contact: string;
  message: string;
  source?: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'SITE_VISIT' | 'NEGOTIATION' | 'CLOSED' | 'NOT_INTERESTED' | 'INVALID';

export interface BusinessLead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
  status: LeadStatus;
  assignedTo: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  contactedAt: string | null;
  siteVisitAt: string | null;
  closedAt: string | null;
  source: string | null;
  lastUpdatedAt: string;
}

export interface LeadSummary { total: number; new: number; contacted: number; siteVisits: number; negotiation: number; closed: number; invalid: number; }
export interface LeadListResult { items: BusinessLead[]; total: number; }
export interface LeadFilters { status?: LeadStatus; propertyId?: string; source?: string; assignedTo?: string; followUpDue?: boolean; page?: number; pageSize?: number; }

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

  list(filters: LeadFilters = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<LeadListResult>(this.baseUrl, { params });
  }

  summary() { return this.http.get<LeadSummary>(`${this.baseUrl}/summary`); }
  getById(id: string) { return this.http.get<BusinessLead>(`${this.baseUrl}/${id}`); }
  updateStatus(id: string, status: LeadStatus) { return this.http.patch<BusinessLead>(`${this.baseUrl}/${id}/status`, { status }); }
  addNote(id: string, note: string) { return this.http.post<BusinessLead>(`${this.baseUrl}/${id}/notes`, { note }); }
  scheduleFollowUp(id: string, nextFollowUpAt: string) { return this.http.post<BusinessLead>(`${this.baseUrl}/${id}/follow-up`, { nextFollowUpAt }); }
}
