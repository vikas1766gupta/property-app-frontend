import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { AuthService } from '../../core/auth/auth.service';
import { LeadService } from '../../core/services/lead.service';
import { TrustService, ReportReason } from '../../core/services/trust.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Property } from '../../shared/models/property.model';
import { UiButtonDirective } from '../../shared/ui/button.directive';
import { UiCardComponent } from '../../shared/ui/card.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state.component';
import { UiInputDirective } from '../../shared/ui/input.directive';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';
import { UiToastComponent } from '../../shared/ui/toast.component';
import { businessVerificationBadge, listingVerificationBadge } from '../../shared/trust-badge';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiButtonDirective, UiCardComponent, UiEmptyStateComponent, UiInputDirective, UiSkeletonComponent, UiToastComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);
  readonly favoriteService = inject(FavoriteService);
  readonly auth = inject(AuthService);
  private readonly leadService = inject(LeadService);
  private readonly trustService = inject(TrustService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly property = signal<Property | null>(null);
  readonly activeImage = signal(0);
  readonly loading = signal(true);
  readonly propertyError = signal<string | null>(null);
  readonly favoriteError = signal<string | null>(null);
  private touchStartX: number | null = null;

  readonly leadName = signal('');
  readonly leadContact = signal('');
  readonly leadMessage = signal('');
  readonly leadSent = signal(false);
  readonly leadError = signal<string | null>(null);
  readonly leadSubmitting = signal(false);
  readonly reportOpen = signal(false);
  readonly reportSent = signal(false);
  readonly reportError = signal<string | null>(null);
  readonly reportReason = signal<ReportReason>('WRONG_INFORMATION');
  readonly reportDescription = signal('');

  listingBadge(status: Property['verificationStatus']): string | null { return listingVerificationBadge(status); }
  sellerBadge(seller: NonNullable<Property['seller']>): string | null { return businessVerificationBadge(seller.verificationStatus, seller.accountType); }

  constructor() {
    if (this.auth.getRole() === 'BUYER') {
      this.favoriteService.loadMine().subscribe({
        error: () => this.favoriteError.set('Saved properties could not be loaded. Try again later.'),
      });
    }
    const id = this.route.snapshot.paramMap.get('id')!;
    this.propertyService.getById(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.loading.set(false);
        this.analyticsService.track({ event: 'PROPERTY_VIEW', propertyId: property.id, city: property.city, propertyType: property.listingType });
      },
      error: () => {
        this.propertyError.set('This property could not be loaded. It may have been removed.');
        this.loading.set(false);
      },
    });
  }

  toggleFavorite(property: Property): void {
    if (this.auth.getRole() !== 'BUYER') {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.favoriteError.set(null);
    this.favoriteService.toggle(property).subscribe({
      next: () => this.analyticsService.track({ event: 'FAVORITE', propertyId: property.id, city: property.city, propertyType: property.listingType }),
      error: () => this.favoriteError.set('Could not update saved properties. Your change was rolled back.'),
    });
  }

  selectImage(index: number): void {
    const imageCount = this.property()?.images.length ?? 0;
    if (imageCount === 0) return;
    this.activeImage.set((index + imageCount) % imageCount);
  }

  previousImage(): void {
    this.selectImage(this.activeImage() - 1);
  }

  nextImage(): void {
    this.selectImage(this.activeImage() + 1);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(deltaX) < 40) return;
    deltaX > 0 ? this.previousImage() : this.nextImage();
  }

  submitLead(): void {
    const property = this.property();
    if (!property || this.leadSubmitting()) return;
    this.leadError.set(null);
    this.leadSubmitting.set(true);
    this.leadService
      .submit({
        propertyId: property.id,
        name: this.leadName(),
        contact: this.leadContact(),
        message: this.leadMessage(),
      })
      .subscribe({
        next: () => {
          this.leadSubmitting.set(false);
          this.leadSent.set(true);
          this.analyticsService.track({ event: 'LEAD_CREATED', propertyId: property.id, city: property.city, propertyType: property.listingType });
        },
        error: () => {
          this.leadSubmitting.set(false);
          this.leadError.set('Could not send your inquiry — please try again.');
        },
      });
  }

  submitReport(): void {
    const property = this.property();
    if (!property) return;
    this.reportError.set(null);
    this.trustService.report({ entityType: 'PROPERTY', entityId: property.id, reason: this.reportReason(), description: this.reportDescription() }).subscribe({
      next: () => { this.reportSent.set(true); this.reportOpen.set(false); },
      error: () => this.reportError.set('The report could not be submitted.'),
    });
  }
}
