import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from "rxjs";
import { PropertyService } from "../../core/services/property.service";
import { FavoriteService } from "../../core/services/favorite.service";
import { AuthService } from "../../core/auth/auth.service";
import {
  Property,
  PropertyNotification,
  PropertySearchFilters,
  SavedSearch,
  SavedSearchFilters,
} from "../../shared/models/property.model";
import { UiButtonDirective } from "../../shared/ui/button.directive";
import { UiInputDirective } from "../../shared/ui/input.directive";
import { UiCardComponent } from "../../shared/ui/card.component";
import { UiEmptyStateComponent } from "../../shared/ui/empty-state.component";
import { UiModalComponent } from "../../shared/ui/modal.component";
import { UiSkeletonComponent } from "../../shared/ui/skeleton.component";
import { UiToastComponent } from "../../shared/ui/toast.component";
import {
  MapCenterSelection,
  PropertyMapComponent,
} from "./property-map.component";

@Component({
  selector: "app-property-listing",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiButtonDirective,
    UiInputDirective,
    UiCardComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    UiSkeletonComponent,
    UiToastComponent,
    PropertyMapComponent,
  ],
  templateUrl: "./property-listing.component.html",
  styleUrl: "./property-listing.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush, // avoid unnecessary re-renders
})
export class PropertyListingComponent {
  private readonly propertyService = inject(PropertyService);
  readonly favoriteService = inject(FavoriteService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly listings = signal<Property[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly favoriteError = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly mapMode = signal(false);
  readonly selectedCenter = signal<MapCenterSelection | null>(null);
  readonly radiusKm = signal(10);
  readonly compareIds = signal<string[]>([]);
  readonly compareOpen = signal(false);
  readonly compareError = signal<string | null>(null);
  readonly savedSearches = signal<SavedSearch[]>([]);
  readonly notifications = signal<PropertyNotification[]>([]);
  readonly savedSearchName = signal("");
  readonly notifyOnMatch = signal(true);
  readonly savedSearchBusy = signal(false);
  readonly savedSearchError = signal<string | null>(null);
  readonly savedSearchMessage = signal<string | null>(null);
  readonly failedImageKeys = signal<string[]>([]);
  readonly filters: PropertySearchFilters = { page: 1, pageSize: 20 };

  private readonly filterChange$ = new Subject<PropertySearchFilters>();
  private readonly activeImages = new Map<string, number>();
  private touchStartX: number | null = null;
  private touchPropertyId: string | null = null;

  constructor() {
    if (this.auth.getRole() === "BUYER") {
      this.favoriteService.loadMine().subscribe({
        error: () =>
          this.favoriteError.set(
            "Saved properties could not be loaded. Try again later.",
          ),
      });
      this.loadBuyerSearchData();
    }

    // Debounced search — instant filter feedback without hammering the API
    this.filterChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap((filters) => {
          this.loading.set(true);
          this.searchError.set(null);
          return this.propertyService.search(filters).pipe(
            catchError(() => {
              this.searchError.set(
                "Properties could not be loaded. Check your connection and try again.",
              );
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((result) => {
        this.listings.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      });

    // Keep an immutable snapshot for distinctUntilChanged. ngModel mutates
    // this.filters in place, so emitting the object itself makes the first
    // change look identical to the previous value and drops that search.
    this.filterChange$.next({ ...this.filters });
  }

  onFilterChange(): void {
    this.filterChange$.next({ ...this.filters });
  }

  retrySearch(): void {
    this.onFilterChange();
  }

  clearFilters(): void {
    for (const key of Object.keys(this.filters) as Array<
      keyof PropertySearchFilters
    >) {
      if (key !== "page" && key !== "pageSize") delete this.filters[key];
    }
    this.selectedCenter.set(null);
    this.radiusKm.set(10);
    this.onFilterChange();
  }

  setView(mapMode: boolean): void {
    this.mapMode.set(mapMode);
    if (mapMode) setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
  }

  selectRadius(value: number): void {
    this.radiusKm.set(value);
    if (this.selectedCenter()) this.onFilterChange();
  }

  onMapCenterSelected(center: MapCenterSelection): void {
    this.selectedCenter.set(center);
    this.filters.latitude = center.latitude;
    this.filters.longitude = center.longitude;
    this.filters.radiusKm = this.radiusKm();
    this.onFilterChange();
  }

  clearRadiusSearch(): void {
    this.selectedCenter.set(null);
    delete this.filters.latitude;
    delete this.filters.longitude;
    delete this.filters.radiusKm;
    this.onFilterChange();
  }

  toggleCompare(property: Property): void {
    const current = this.compareIds();
    if (current.includes(property.id)) {
      this.compareIds.set(current.filter((id) => id !== property.id));
      return;
    }
    if (current.length >= 3) {
      this.compareError.set("Compare up to three properties at a time.");
      return;
    }
    this.compareError.set(null);
    this.compareIds.set([...current, property.id]);
  }

  isCompared(propertyId: string): boolean {
    return this.compareIds().includes(propertyId);
  }

  get comparedProperties(): Property[] {
    const ids = this.compareIds();
    return ids
      .map((id) => this.listings().find((property) => property.id === id))
      .filter((property): property is Property => !!property);
  }

  clearCompare(): void {
    this.compareIds.set([]);
    this.compareOpen.set(false);
  }

  saveCurrentSearch(): void {
    if (this.auth.getRole() !== "BUYER" || this.savedSearchBusy()) return;
    const name = this.savedSearchName().trim();
    if (!name) {
      this.savedSearchError.set("Enter a name for this saved search.");
      return;
    }

    const searchFilters = { ...this.filters };
    delete searchFilters.page;
    delete searchFilters.pageSize;
    const filters = Object.fromEntries(
      Object.entries(searchFilters).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    ) as SavedSearchFilters;
    if (Object.keys(filters).length === 0) {
      this.savedSearchError.set(
        "Choose at least one filter before saving a search.",
      );
      return;
    }

    this.savedSearchBusy.set(true);
    this.savedSearchError.set(null);
    this.savedSearchMessage.set(null);
    this.propertyService
      .createSavedSearch({
        name,
        filters,
        notifyOnMatch: this.notifyOnMatch(),
      })
      .subscribe({
        next: (savedSearch) => {
          this.savedSearches.update((searches) => [savedSearch, ...searches]);
          this.savedSearchName.set("");
          this.savedSearchMessage.set(
            this.notifyOnMatch()
              ? "Search saved. Matching new listings will appear in alerts."
              : "Search saved.",
          );
          this.savedSearchBusy.set(false);
        },
        error: (error) => {
          this.savedSearchError.set(
            error.error?.error || "Could not save this search.",
          );
          this.savedSearchBusy.set(false);
        },
      });
  }

  applySavedSearch(savedSearch: SavedSearch): void {
    for (const key of Object.keys(this.filters) as Array<
      keyof PropertySearchFilters
    >) {
      if (key !== "page" && key !== "pageSize") delete this.filters[key];
    }
    Object.assign(this.filters, savedSearch.filters, { page: 1, pageSize: 20 });
    const { latitude, longitude, radiusKm } = savedSearch.filters;
    this.radiusKm.set(radiusKm ?? 10);
    this.selectedCenter.set(
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : null,
    );
    this.onFilterChange();
  }

  removeSavedSearch(savedSearch: SavedSearch): void {
    this.propertyService.removeSavedSearch(savedSearch.id).subscribe({
      next: () =>
        this.savedSearches.update((searches) =>
          searches.filter((item) => item.id !== savedSearch.id),
        ),
      error: () =>
        this.savedSearchError.set("Could not remove this saved search."),
    });
  }

  private loadBuyerSearchData(): void {
    this.propertyService.listSavedSearches().subscribe({
      next: (searches) => this.savedSearches.set(searches),
      error: () =>
        this.savedSearchError.set("Saved searches could not be loaded."),
    });
    this.propertyService.listNotifications().subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: () =>
        this.savedSearchError.set("Search alerts could not be loaded."),
    });
  }

  toggleFavorite(property: Property): void {
    if (this.auth.getRole() !== "BUYER") {
      this.router.navigate(["/login"], {
        queryParams: { returnUrl: "/properties" },
      });
      return;
    }
    this.favoriteError.set(null);
    this.favoriteService.toggle(property).subscribe({
      error: () =>
        this.favoriteError.set(
          "Could not update saved properties. Your change was rolled back.",
        ),
    });
  }

  // trackBy avoids re-rendering unchanged cards in the *ngFor loop
  trackByPropertyId(_index: number, property: Property): string {
    return property.id;
  }

  activeImage(property: Property): number {
    return this.activeImages.get(property.id) ?? 0;
  }

  imagesFor(property: Property): string[] {
    return property.images.length ? property.images : [""];
  }

  imageKey(property: Property, index: number): string {
    return `${property.id}:${index}`;
  }

  isImageFailed(property: Property, index: number): boolean {
    return (
      this.failedImageKeys().includes(this.imageKey(property, index)) ||
      !this.imagesFor(property)[index]
    );
  }

  onImageError(property: Property, index: number): void {
    const key = this.imageKey(property, index);
    if (!this.failedImageKeys().includes(key))
      this.failedImageKeys.update((keys) => [...keys, key]);
  }

  selectImage(property: Property, index: number): void {
    if (property.images.length < 2) return;
    this.activeImages.set(
      property.id,
      (index + property.images.length) % property.images.length,
    );
  }

  previousImage(property: Property): void {
    this.selectImage(property, this.activeImage(property) - 1);
  }

  nextImage(property: Property): void {
    this.selectImage(property, this.activeImage(property) + 1);
  }

  onTouchStart(property: Property, event: TouchEvent): void {
    this.touchPropertyId = property.id;
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(property: Property, event: TouchEvent): void {
    if (this.touchPropertyId !== property.id || this.touchStartX === null)
      return;
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = null;
    this.touchPropertyId = null;
    if (Math.abs(deltaX) < 40) return;
    deltaX > 0 ? this.previousImage(property) : this.nextImage(property);
  }
}
