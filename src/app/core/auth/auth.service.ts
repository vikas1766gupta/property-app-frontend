import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
}

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly isLoggedIn = signal(!!localStorage.getItem(TOKEN_KEY));

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password });
  }

  registerBusiness(email: string, password: string, companyName: string, contactPhone?: string) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/business/register`, {
      email,
      password,
      companyName,
      contactPhone,
    });
  }

  registerBuyer(email: string, password?: string) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/buyer/register`, { email, password });
  }

  registerAdmin(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/admin/register`, { email, password });
  }

  storeToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.isLoggedIn.set(true);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.isLoggedIn.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Decodes the JWT payload without a library — good enough for reading role/businessId client-side. */
  getRole(): 'BUSINESS' | 'BUYER' | 'ADMIN' | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).role ?? null;
    } catch {
      return null;
    }
  }

  getBusinessId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).businessId ?? null;
    } catch {
      return null;
    }
  }
}
