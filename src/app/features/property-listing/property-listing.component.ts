import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { PropertyService } from '../../core/services/property.service';
import { Property, PropertySearchFilters } from '../../shared/models/property.model';

@Component({
  selector: 'app-property-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './property-listing.component.html',
  styleUrl: './property-listing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // avoid unnecessary re-renders
})
export class PropertyListingComponent {
  private readonly propertyService = inject(PropertyService);

  readonly listings = signal<Property[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly filters: PropertySearchFilters = { page: 1, pageSize: 20 };

  private readonly filterChange$ = new Subject<PropertySearchFilters>();
  private readonly activeImages = new Map<string, number>();
  private touchStartX: number | null = null;
  private touchPropertyId: string | null = null;

  constructor() {
    // Debounced search — instant filter feedback without hammering the API
    this.filterChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap((filters) => {
          this.loading.set(true);
          return this.propertyService.search(filters);
        })
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

  // trackBy avoids re-rendering unchanged cards in the *ngFor loop
  trackByPropertyId(_index: number, property: Property): string {
    return property.id;
  }

  activeImage(property: Property): number {
    return this.activeImages.get(property.id) ?? 0;
  }

  imagesFor(property: Property): string[] {
    return property.images.length ? property.images : ['assets/placeholder.jpg'];
  }

  selectImage(property: Property, index: number): void {
    if (property.images.length < 2) return;
    this.activeImages.set(property.id, (index + property.images.length) % property.images.length);
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
    if (this.touchPropertyId !== property.id || this.touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = null;
    this.touchPropertyId = null;
    if (Math.abs(deltaX) < 40) return;
    deltaX > 0 ? this.previousImage(property) : this.nextImage(property);
  }
}
