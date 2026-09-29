import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  Project,
  ProjectSearchResult,
} from "../../shared/models/project.model";

@Injectable({ providedIn: "root" })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;
  search(
    filters: Record<string, string | number | boolean | undefined> = {},
  ): Observable<ProjectSearchResult> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "")
        params = params.set(key, String(value));
    });
    return this.http.get<ProjectSearchResult>(this.baseUrl, { params });
  }
  getById(id: string): Observable<{ project: Project; similar: Project[] }> {
    return this.http.get<{ project: Project; similar: Project[] }>(
      `${this.baseUrl}/${id}`,
    );
  }
  mine(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/mine/all`);
  }
  create(
    payload: Partial<Project> & {
      name: string;
      description: string;
      propertyType: string;
      city: string;
      locality: string;
      address: string;
      totalUnits: number;
      availableUnits: number;
    },
  ): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, payload);
  }
  update(id: string, payload: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}`, payload);
  }
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
  enquire(
    id: string,
    payload: { name: string; contact: string; message: string },
  ): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/enquiries`, payload);
  }
}
