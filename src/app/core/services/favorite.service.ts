import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property } from '../../shared/models/property.model';

export interface FavoriteRecord {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property: Property;
}

export type FavoriteMutationResponse =
  | (FavoriteRecord & { isFavorited: true })
  | { propertyId: string; isFavorited: false };

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/favorites`;

  readonly favorites = signal<FavoriteRecord[]>([]);
  readonly favoriteIds = signal<ReadonlySet<string>>(new Set());
  readonly pendingIds = signal<ReadonlySet<string>>(new Set());
  readonly loading = signal(false);

  loadMine(): Observable<FavoriteRecord[]> {
    this.loading.set(true);
    return this.http.get<FavoriteRecord[]>(this.baseUrl).pipe(
      tap((favorites) => this.replaceFavorites(favorites)),
      finalize(() => this.loading.set(false)),
    );
  }

  isFavorited(propertyId: string): boolean {
    return this.favoriteIds().has(propertyId);
  }

  isPending(propertyId: string): boolean {
    return this.pendingIds().has(propertyId);
  }

  toggle(property: Property): Observable<void> {
    const propertyId = property.id;
    if (this.isPending(propertyId)) return throwError(() => new Error('Favorite update already in progress'));

    const wasFavorited = this.isFavorited(propertyId);
    const previous = this.favorites().find((favorite) => favorite.propertyId === propertyId);
    this.setPending(propertyId, true);
    if (wasFavorited) {
      this.removeFromState(propertyId);
    } else {
      this.upsertInState({
        id: `optimistic-${propertyId}`,
        userId: '',
        propertyId,
        createdAt: new Date().toISOString(),
        property,
      });
    }

    const request = wasFavorited
      ? this.http.delete<FavoriteMutationResponse>(`${this.baseUrl}/${propertyId}`)
      : this.http.put<FavoriteMutationResponse>(`${this.baseUrl}/${propertyId}`, {});

    return request.pipe(
      tap((result) => {
        if (result.isFavorited && 'property' in result) this.upsertInState(result);
        else this.removeFromState(propertyId);
      }),
      map(() => undefined),
      catchError((error) => {
        if (previous) this.upsertInState(previous);
        else this.removeFromState(propertyId);
        return throwError(() => error);
      }),
      finalize(() => this.setPending(propertyId, false)),
    );
  }

  private replaceFavorites(favorites: FavoriteRecord[]): void {
    this.favorites.set(favorites);
    this.favoriteIds.set(new Set(favorites.map((favorite) => favorite.propertyId)));
  }

  private upsertInState(favorite: FavoriteRecord): void {
    this.favorites.update((favorites) => [
      ...favorites.filter((item) => item.propertyId !== favorite.propertyId),
      favorite,
    ]);
    this.favoriteIds.update((ids) => new Set(ids).add(favorite.propertyId));
  }

  private removeFromState(propertyId: string): void {
    this.favorites.update((favorites) => favorites.filter((favorite) => favorite.propertyId !== propertyId));
    this.favoriteIds.update((ids) => {
      const next = new Set(ids);
      next.delete(propertyId);
      return next;
    });
  }

  private setPending(propertyId: string, pending: boolean): void {
    this.pendingIds.update((ids) => {
      const next = new Set(ids);
      if (pending) next.add(propertyId);
      else next.delete(propertyId);
      return next;
    });
  }
}