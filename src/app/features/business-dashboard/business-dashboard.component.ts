import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PropertyService } from '../../core/services/property.service';
import { PaymentService, PaymentRecord } from '../../core/services/payment.service';
import { Promotion, PromotionConfig, PromotionService } from '../../core/services/promotion.service';
import { LeadService, BusinessLead, LeadStatus, LeadSummary } from '../../core/services/lead.service';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/services/business.service';
import { BusinessProfile, BusinessProfileUpdate } from '../../shared/models/business.model';
import { Property, PropertyImageInput } from '../../shared/models/property.model';
import { LocationPickerComponent, PickedLocation } from '../property-listing/location-picker.component';
import { UiButtonDirective } from '../../shared/ui/button.directive';
import { UiCardComponent } from '../../shared/ui/card.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state.component';
import { UiInputDirective } from '../../shared/ui/input.directive';
import { UiModalComponent } from '../../shared/ui/modal.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';
import { UiToastComponent } from '../../shared/ui/toast.component';
import { Entitlements, SubscriptionService } from '../../core/services/subscription.service';
import { environment } from '../../../environments/environment';
import { AnalyticsService, BusinessAnalyticsSummary, BuilderAnalyticsSummary } from '../../core/services/analytics.service';

declare const Stripe: any; // loaded via <script src="https://js.stripe.com/v3/"> in index.html

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_LISTING_IMAGES = 20;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ListingImageDraft {
  key: string;
  uploadId: string | null;
  name: string;
  previewUrl: string;
  file: File | null;
  progress: number;
  uploading: boolean;
  isCover: boolean;
  error: string | null;
}

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LocationPickerComponent, UiButtonDirective, UiCardComponent, UiEmptyStateComponent, UiInputDirective, UiModalComponent, UiSkeletonComponent, UiToastComponent],
  templateUrl: './business-dashboard.component.html',
  styleUrl: './business-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDashboardComponent implements OnDestroy {
  private readonly propertyService = inject(PropertyService);
  private readonly paymentService = inject(PaymentService);
  private readonly promotionService = inject(PromotionService, { optional: true });
  private readonly leadService = inject(LeadService);
  private readonly auth = inject(AuthService);
  private readonly businessService = inject(BusinessService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly subscriptionService = inject(HttpClient, { optional: true }) ? inject(SubscriptionService) : null;

  @ViewChild('cardElementRef') cardElementRef?: ElementRef<HTMLDivElement>;

  readonly listings = signal<Property[]>([]);
  readonly payments = signal<PaymentRecord[]>([]);
  readonly leads = signal<BusinessLead[]>([]);
  readonly leadsLoading = signal(true);
  readonly leadsError = signal<string | null>(null);
  readonly leadSummary = signal<LeadSummary>({ total: 0, new: 0, contacted: 0, siteVisits: 0, negotiation: 0, closed: 0, invalid: 0 });
  readonly leadTotal = signal(0);
  readonly leadPage = signal(1);
  readonly leadPageSize = 10;
  readonly leadStatusFilter = signal<LeadStatus | ''>('');
  readonly leadSourceFilter = signal('');
  readonly leadFollowUpDue = signal(false);
  readonly selectedLead = signal<BusinessLead | null>(null);
  readonly leadDetailLoading = signal(false);
  readonly leadDetailError = signal<string | null>(null);
  readonly leadActionError = signal<string | null>(null);
  readonly analytics = signal<BusinessAnalyticsSummary | null>(null);
  readonly builderAnalytics = signal<BuilderAnalyticsSummary | null>(null);
  readonly analyticsDays = signal<7 | 30 | 90>(30);
  readonly analyticsError = signal<string | null>(null);
  readonly leadNote = signal('');
  readonly leadFollowUpAt = signal('');
  readonly leadStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'INTERESTED', 'SITE_VISIT', 'NEGOTIATION', 'CLOSED', 'NOT_INTERESTED', 'INVALID'];
  readonly freeRemaining = signal(0);
  readonly loading = signal(true);
  readonly showCreateForm = signal(false);
  readonly editingPropertyId = signal<string | null>(null);
  readonly listingError = signal<string | null>(null);
  readonly listingLoadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly freeRemainingError = signal<string | null>(null);
  readonly savingListing = signal(false);
  readonly paymentsLoading = signal(true);
  readonly paymentsError = signal<string | null>(null);
  readonly showCheckout = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly checkoutProcessing = signal(false);
  readonly checkoutLoading = signal(false);
  readonly checkoutMessage = signal<string | null>(null);
  readonly imageDrafts = signal<ListingImageDraft[]>([]);
  readonly imageDragActive = signal(false);
  readonly imageUploadError = signal<string | null>(null);
  readonly profile = signal<BusinessProfile | null>(null);
  readonly profileLoading = signal(false);
  readonly profileSaving = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly profileMessage = signal<string | null>(null);
  readonly entitlements = signal<Entitlements | null>(null);
  readonly promotionConfigs = signal<PromotionConfig[]>([]);
  readonly promotionMessage = signal<string | null>(null);
  readonly promotions = signal<Promotion[]>([]);

  profileForm: BusinessProfileUpdate = {
    accountType: 'OWNER', displayName: '', companyName: '', profileImage: null, bio: '', yearsOfExperience: null,
    phone: null, website: null, city: null, servedLocalities: [],
  };

  // create-listing form model
  form = {
    listingType: 'RENT' as 'RENT' | 'SALE',
    title: '',
    description: '',
    price: 0,
    addressLine: '',
    city: '',
    state: '',
    country: '',
    bedrooms: undefined as number | null | undefined,
    bathrooms: undefined as number | null | undefined,
    areaSqft: undefined as number | null | undefined,
    furnishingStatus: '',
    amenities: '',
    latitude: undefined as number | null | undefined,
    longitude: undefined as number | null | undefined,
  };

  private stripe: any;
  private cardElement: any;
  private pendingPropertyId: string | null = null;
  private readonly imageUploadSubscriptions = new Map<string, Subscription>();

  constructor() {
    this.promotionService?.configs().subscribe({ next: (configs) => this.promotionConfigs.set(configs), error: () => undefined });
    this.refresh();
    this.loadProfile();
  }

  loadAnalytics(): void {
    if (!this.entitlements()?.analytics) {
      this.analytics.set(null);
      this.builderAnalytics.set(null);
      this.analyticsError.set(null);
      return;
    }
    const days = this.analyticsDays();
    this.analyticsError.set(null);
    this.analyticsService.business(days).subscribe({ next: (data) => this.analytics.set(data), error: () => this.analyticsError.set('Analytics could not be loaded.') });
    if (this.profile()?.accountType === 'BUILDER') {
      this.analyticsService.builder(days).subscribe({ next: (data) => this.builderAnalytics.set(data), error: () => undefined });
    }
  }

  setAnalyticsDays(days: 7 | 30 | 90): void { this.analyticsDays.set(days); this.loadAnalytics(); }

  promoteListing(property: Property): void {
    const config = this.promotionConfigs().find((item) => item.type === 'FEATURED' && item.isActive);
    if (!config) { this.promotionMessage.set('No listing promotion is currently available.'); return; }
    this.promotionService?.purchase('PROPERTY', property.id, config.type).subscribe({
      next: ({ checkout }) => {
        if (!checkout) { this.promotionMessage.set('Promotion activated.'); return; }
        this.showCheckout.set(true);
        this.checkoutError.set(null);
        this.checkoutMessage.set(null);
        this.checkoutLoading.set(false);
        setTimeout(() => this.mountStripeCard(checkout.clientSecret), 0);
      },
      error: (error) => this.promotionMessage.set(error?.error?.error ?? 'Promotion could not be started.'),
    });
  }

  hasActivePromotion(propertyId: string): boolean {
    const now = Date.now();
    return this.promotions().some((promotion) => promotion.propertyId === propertyId && promotion.status === 'ACTIVE' && new Date(promotion.endAt).getTime() > now);
  }

  ngOnDestroy(): void {
    this.cardElement?.destroy();
    this.clearImageDrafts();
  }

  refresh(): void {
    this.loading.set(true);
    this.listingLoadError.set(null);
    this.propertyService.myListings().subscribe({
      next: (listings) => {
        this.listings.set(listings);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.listingLoadError.set('Listings could not be loaded. Refresh to try again.');
      },
    });
    this.promotionService?.mine().subscribe({ next: (promotions) => this.promotions.set(promotions), error: () => undefined });
    this.freeRemainingError.set(null);
    this.propertyService.freeListingsRemaining().subscribe({
      next: (result) => this.freeRemaining.set(result.remaining),
      error: () => this.freeRemainingError.set('Free listing allowance could not be loaded.'),
    });
    this.subscriptionService?.entitlements().subscribe({
      next: (entitlements) => {
        this.entitlements.set(entitlements);
        this.freeRemaining.set(Math.max(0, entitlements.maxActiveListings - entitlements.listingUsage));
        this.loadAnalytics();
      },
      error: () => undefined,
    });
    this.paymentsLoading.set(true);
    this.paymentsError.set(null);
    this.paymentService.history().subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.paymentsLoading.set(false);
      },
      error: () => {
        this.paymentsLoading.set(false);
        this.paymentsError.set('Payment history could not be loaded.');
      },
    });
    this.loadLeads();
    this.leadService.summary().subscribe({ next: (summary) => this.leadSummary.set(summary), error: () => undefined });
  }

  loadLeads(): void {
    this.leadsLoading.set(true);
    this.leadsError.set(null);
    this.leadService.list({ status: this.leadStatusFilter() || undefined, source: this.leadSourceFilter().trim() || undefined, followUpDue: this.leadFollowUpDue() || undefined, page: this.leadPage(), pageSize: this.leadPageSize }).subscribe({
      next: (result) => { this.leads.set(result.items); this.leadTotal.set(result.total); this.leadsLoading.set(false); },
      error: () => { this.leadsLoading.set(false); this.leadsError.set('Unable to load leads. Please refresh to try again.'); },
    });
  }

  resetLeadFilters(): void { this.leadPage.set(1); this.loadLeads(); }
  previousLeadPage(): void { if (this.leadPage() > 1) { this.leadPage.update((page) => page - 1); this.loadLeads(); } }
  nextLeadPage(): void { if (this.leadPage() * this.leadPageSize < this.leadTotal()) { this.leadPage.update((page) => page + 1); this.loadLeads(); } }

  openLead(lead: BusinessLead): void {
    this.selectedLead.set(lead);
    this.leadDetailLoading.set(true);
    this.leadDetailError.set(null);
    this.leadService.getById(lead.id).subscribe({
      next: (detail) => { this.selectedLead.set(detail); this.leadDetailLoading.set(false); },
      error: () => { this.leadDetailLoading.set(false); this.leadDetailError.set('Lead details could not be loaded.'); },
    });
  }

  closeLead(): void { this.selectedLead.set(null); this.leadActionError.set(null); this.leadNote.set(''); this.leadFollowUpAt.set(''); }

  changeLeadStatus(lead: BusinessLead, status: LeadStatus): void {
    this.leadActionError.set(null);
    this.leadService.updateStatus(lead.id, status).subscribe({
      next: (updated) => { this.replaceLead(updated); this.leadService.summary().subscribe((summary) => this.leadSummary.set(summary)); },
      error: (error) => { this.leadActionError.set(error?.error?.error ?? 'Lead status could not be updated.'); this.loadLeads(); },
    });
  }

  addLeadNote(): void {
    const lead = this.selectedLead();
    const note = this.leadNote().trim();
    if (!lead || !note) return;
    this.leadService.addNote(lead.id, note).subscribe({ next: (updated) => { this.replaceLead(updated); this.leadNote.set(''); }, error: () => this.leadActionError.set('Note could not be saved.') });
  }

  scheduleLeadFollowUp(): void {
    const lead = this.selectedLead();
    if (!lead || !this.leadFollowUpAt()) return;
    this.leadService.scheduleFollowUp(lead.id, new Date(this.leadFollowUpAt()).toISOString()).subscribe({ next: (updated) => { this.replaceLead(updated); this.leadFollowUpAt.set(''); }, error: (error) => this.leadActionError.set(error?.error?.error ?? 'Follow-up could not be scheduled.') });
  }

  private replaceLead(updated: BusinessLead): void {
    this.leads.update((leads) => leads.map((lead) => lead.id === updated.id ? updated : lead));
    this.selectedLead.set(updated);
  }

  private loadProfile(): void {
    const businessId = this.auth.getBusinessId?.();
    if (!businessId) return;
    this.profileLoading.set(true);
    this.businessService.getById(businessId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileForm = {
          accountType: profile.accountType,
          displayName: profile.displayName ?? '',
          companyName: profile.companyName,
          profileImage: profile.profileImage,
          bio: profile.bio ?? '',
          yearsOfExperience: profile.yearsOfExperience,
          phone: profile.phone,
          website: profile.website,
          city: profile.city,
          servedLocalities: [...profile.servedLocalities],
        };
        this.profileLoading.set(false);
        if (this.entitlements()?.analytics && profile.accountType === 'BUILDER') {
          this.analyticsService.builder(this.analyticsDays()).subscribe({ next: (data) => this.builderAnalytics.set(data), error: () => undefined });
        }
      },
      error: () => { this.profileLoading.set(false); this.profileError.set('Profile could not be loaded.'); },
    });
  }

  saveProfile(): void {
    if (this.profileSaving()) return;
    this.profileSaving.set(true);
    this.profileError.set(null);
    this.profileMessage.set(null);
    const payload = { ...this.profileForm, servedLocalities: this.profileForm.servedLocalities?.map((locality) => locality.trim()).filter(Boolean) };
    this.businessService.updateMine(payload).subscribe({
      next: (profile) => { this.profile.set(profile); this.profileSaving.set(false); this.profileMessage.set('Profile updated.'); },
      error: () => { this.profileSaving.set(false); this.profileError.set('Profile could not be updated. Check the details and try again.'); },
    });
  }

  trackByPropertyId(_i: number, p: Property): string {
    return p.id;
  }

  trackByLeadId(_i: number, lead: BusinessLead): string {
    return lead.id;
  }

  createListing(): void {
    this.saveListing();
  }

  openCreateForm(): void {
    this.clearImageDrafts();
    this.editingPropertyId.set(null);
    this.listingError.set(null);
    this.form = {
      listingType: 'RENT',
      title: '',
      description: '',
      price: 0,
      addressLine: '',
      city: '',
      state: '',
      country: '',
      bedrooms: undefined,
      bathrooms: undefined,
      areaSqft: undefined,
      furnishingStatus: '',
      amenities: '',
      latitude: undefined,
      longitude: undefined,
    };
    this.showCreateForm.set(true);
  }

  editListing(property: Property): void {
    this.clearImageDrafts();
    this.editingPropertyId.set(property.id);
    this.listingError.set(null);
    this.form = {
      listingType: property.listingType,
      title: property.title,
      description: property.description,
      price: property.price,
      addressLine: property.addressLine,
      city: property.city,
      state: property.state,
      country: property.country,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      furnishingStatus: property.furnishingStatus ?? '',
      amenities: property.amenities.join(', '),
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
    };
    this.imageDrafts.set((property.imageRefs ?? []).map((image) => ({
      key: image.id,
      uploadId: image.id,
      name: image.url.split('/').pop() || 'Listing image',
      previewUrl: image.url,
      file: null,
      progress: 100,
      uploading: false,
      isCover: image.isCover,
      error: null,
    })));
    this.showCreateForm.set(true);
  }

  cancelListingForm(): void {
    this.clearImageDrafts();
    this.showCreateForm.set(false);
    this.editingPropertyId.set(null);
    this.listingError.set(null);
  }

  onLocationChange(location: PickedLocation | null): void {
    const clearedValue = this.editingPropertyId() ? null : undefined;
    this.form.latitude = location ? location.latitude : clearedValue;
    this.form.longitude = location ? location.longitude : clearedValue;
  }

  onImageFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addImageFiles(Array.from(input.files));
    input.value = '';
  }

  onImageDragOver(event: DragEvent): void {
    event.preventDefault();
    this.imageDragActive.set(true);
  }

  onImageDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.imageDragActive.set(false);
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    this.imageDragActive.set(false);
    if (event.dataTransfer?.files) this.addImageFiles(Array.from(event.dataTransfer.files));
  }

  retryImageUpload(key: string): void {
    const draft = this.imageDrafts().find((image) => image.key === key);
    if (draft?.file && !draft.uploading) this.uploadImageDraft(key, draft.file);
  }

  removeImage(key: string): void {
    this.imageUploadSubscriptions.get(key)?.unsubscribe();
    this.imageUploadSubscriptions.delete(key);
    const removed = this.imageDrafts().find((image) => image.key === key);
    if (removed) this.releaseImagePreview(removed.previewUrl);
    const remaining = this.imageDrafts().filter((image) => image.key !== key);
    if (removed?.isCover && remaining.length && !remaining.some((image) => image.isCover)) {
      remaining[0] = { ...remaining[0], isCover: true };
    }
    this.imageDrafts.set(remaining);
  }

  moveImage(index: number, offset: -1 | 1): void {
    const images = [...this.imageDrafts()];
    const destination = index + offset;
    if (destination < 0 || destination >= images.length) return;
    [images[index], images[destination]] = [images[destination], images[index]];
    this.imageDrafts.set(images);
  }

  setCoverImage(key: string): void {
    this.imageDrafts.update((images) => images.map((image) => ({ ...image, isCover: image.key === key })));
  }

  isListingDetailsValid(): boolean {
    const validInteger = (value: number | null | undefined, minimum: number): boolean =>
      value === undefined || value === null || (Number.isInteger(value) && value >= minimum);

    return this.form.title.trim().length >= 5
      && this.form.title.trim().length <= 150
      && this.form.description.trim().length >= 20
      && Number.isFinite(Number(this.form.price))
      && Number(this.form.price) > 0
      && this.form.addressLine.trim().length >= 3
      && this.form.city.trim().length >= 2
      && this.form.state.trim().length >= 2
      && this.form.country.trim().length >= 2
      && validInteger(this.form.bedrooms, 0)
      && validInteger(this.form.bathrooms, 0)
      && validInteger(this.form.areaSqft, 1);
  }

  canSaveListing(): boolean {
    const images = this.imageDrafts();
    return !this.savingListing()
      && this.isListingDetailsValid()
      && images.every((image) => Boolean(image.uploadId) && !image.uploading && !image.error)
      && (images.length === 0 || images.filter((image) => image.isCover).length === 1);
  }

  private addImageFiles(files: File[]): void {
    this.imageUploadError.set(null);
    const accepted: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        this.imageUploadError.set(`${file.name}: choose a JPEG, PNG, or WebP image.`);
      } else if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
        this.imageUploadError.set(`${file.name}: images must be larger than 0 bytes and no larger than 8 MB.`);
      } else {
        accepted.push(file);
      }
    }

    const available = MAX_LISTING_IMAGES - this.imageDrafts().length;
    if (accepted.length > available) {
      this.imageUploadError.set(`A listing can contain at most ${MAX_LISTING_IMAGES} images.`);
    }
    accepted.slice(0, Math.max(0, available)).forEach((file) => {
      const key = crypto.randomUUID();
      const draft: ListingImageDraft = {
        key,
        uploadId: null,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        file,
        progress: 0,
        uploading: true,
        isCover: this.imageDrafts().length === 0,
        error: null,
      };
      this.imageDrafts.update((images) => [...images, draft]);
      this.uploadImageDraft(key, file);
    });
  }

  private uploadImageDraft(key: string, file: File): void {
    this.imageDrafts.update((images) => images.map((image) => image.key === key
      ? { ...image, uploading: true, progress: 0, error: null }
      : image));
    const subscription = this.propertyService.uploadImage(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          this.imageDrafts.update((images) => images.map((image) => image.key === key ? { ...image, progress } : image));
        } else if (event.type === HttpEventType.Response) {
          const uploadedImage = (event as HttpResponse<{ id: string; url: string }>).body;
          if (!uploadedImage) return;
          this.imageDrafts.update((images) => images.map((image) => {
            if (image.key !== key) return image;
            this.releaseImagePreview(image.previewUrl);
            return { ...image, uploadId: uploadedImage.id, previewUrl: uploadedImage.url, file: null, progress: 100, uploading: false };
          }));
          this.imageUploadSubscriptions.delete(key);
        }
      },
      error: (error) => {
        this.imageDrafts.update((images) => images.map((image) => image.key === key
          ? { ...image, uploading: false, error: `${error.error?.error || 'Upload failed.'} Retry or remove this image.` }
          : image));
        this.imageUploadSubscriptions.delete(key);
      },
    });
    this.imageUploadSubscriptions.set(key, subscription);
  }

  private clearImageDrafts(): void {
    this.imageUploadSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.imageUploadSubscriptions.clear();
    this.imageDrafts().forEach((image) => this.releaseImagePreview(image.previewUrl));
    this.imageDrafts.set([]);
    this.imageUploadError.set(null);
  }

  private releaseImagePreview(url: string): void {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }

  private saveListing(): void {
    if (!this.canSaveListing()) return;
    this.listingError.set(null);
    this.actionError.set(null);
    const editingId = this.editingPropertyId();
    const payload = {
      listingType: this.form.listingType,
      title: this.form.title,
      description: this.form.description,
      price: Number(this.form.price),
      addressLine: this.form.addressLine,
      city: this.form.city,
      state: this.form.state,
      country: this.form.country,
      bedrooms: this.form.bedrooms,
      bathrooms: this.form.bathrooms,
      areaSqft: this.form.areaSqft,
      furnishingStatus: this.form.furnishingStatus.trim() || (editingId ? null : undefined),
      amenities: this.form.amenities ? this.form.amenities.split(',').map((a) => a.trim()) : [],
      latitude: this.form.latitude,
      longitude: this.form.longitude,
      imageRefs: this.imageDrafts().map((image): PropertyImageInput => ({ id: image.uploadId!, isCover: image.isCover })),
    };

    this.savingListing.set(true);
    if (editingId) {
      this.propertyService.update(editingId, payload).subscribe({
        next: () => {
          this.savingListing.set(false);
          this.cancelListingForm();
          this.refresh();
        },
        error: (error) => {
          this.savingListing.set(false);
          this.listingError.set(this.getSaveErrorMessage(error));
        },
      });
      return;
    }

    this.propertyService.create({
      ...payload,
      bedrooms: payload.bedrooms ?? undefined,
      bathrooms: payload.bathrooms ?? undefined,
      areaSqft: payload.areaSqft ?? undefined,
      latitude: payload.latitude ?? undefined,
      longitude: payload.longitude ?? undefined,
    }).subscribe({
      next: ({ property, requiresPayment }) => {
        this.savingListing.set(false);
        this.cancelListingForm();
        if (requiresPayment) {
          this.pendingPropertyId = property.id;
          this.openCheckout(property.id);
        } else {
          this.refresh();
        }
      },
      error: (error) => {
        this.savingListing.set(false);
        this.listingError.set(this.getSaveErrorMessage(error));
      },
    });
  }

  private getSaveErrorMessage(error: any): string {
    const body = error?.error;
    const fieldErrors = body?.details?.fieldErrors as Record<string, string[]> | undefined;
    const firstFieldError = Object.entries(fieldErrors ?? {}).find(([, messages]) => messages.length > 0);
    if (firstFieldError) return `${firstFieldError[0]}: ${firstFieldError[1][0]}`;
    return body?.error ?? 'Unable to save the listing. Please try again.';
  }

  /* The following methods handle the separate payment flow for paid listings. */
  openCheckout(propertyId: string): void {
    this.pendingPropertyId = propertyId;
    this.showCheckout.set(true);
    this.checkoutError.set(null);
    this.checkoutMessage.set(null);
    this.checkoutLoading.set(true);
    this.checkoutProcessing.set(false);

    this.paymentService.createIntent(propertyId).subscribe({
      next: ({ clientSecret }) => {
        this.checkoutLoading.set(false);
        // Deferred so the *ngIf-rendered card container exists in the DOM first.
        setTimeout(() => this.mountStripeCard(clientSecret), 0);
      },
      error: () => { this.checkoutLoading.set(false); this.checkoutError.set('Payment could not be initialized. Try again.'); },
    });
  }

  private mountStripeCard(clientSecret: string): void {
    if (!environment.stripePublishableKey) {
      this.checkoutError.set('Payments are not configured yet. Please try again later.');
      return;
    }
    if (!this.stripe) this.stripe = Stripe(environment.stripePublishableKey);
    const elements = this.stripe.elements();
    this.cardElement = elements.create('card');
    this.cardElement.mount(this.cardElementRef!.nativeElement);
    (this as any)._clientSecret = clientSecret;
  }

  confirmPayment(): void {
    this.checkoutProcessing.set(true);
    this.checkoutError.set(null);

    this.stripe
      .confirmCardPayment((this as any)._clientSecret, { payment_method: { card: this.cardElement } })
      .then((result: any) => {
        this.checkoutProcessing.set(false);
        if (result.error) {
          this.checkoutError.set(result.error.message);
          return;
        }
        // Actual publish happens server-side via the Stripe webhook; refresh
        // picks it up once that's processed (usually within a second or two).
        this.showCheckout.set(false);
        this.checkoutMessage.set('Payment submitted. Your listing or promotion will activate after Stripe confirms it.');
        this.cardElement?.destroy();
        this.refresh();
      })
      .catch(() => this.checkoutError.set('Payment could not be completed. Check your card and try again.'))
      .finally(() => this.checkoutProcessing.set(false));
  }

  cancelCheckout(): void {
    this.showCheckout.set(false);
    this.checkoutLoading.set(false);
    this.checkoutProcessing.set(false);
    this.checkoutError.set(null);
    this.cardElement?.destroy();
    this.cardElement = null;
  }

  deleteListing(id: string): void {
    if (!confirm('Delete this listing?')) return;
    this.actionError.set(null);
    this.propertyService.delete(id).subscribe({
      next: () => this.refresh(),
      error: () => this.actionError.set('Listing could not be deleted. Please try again.'),
    });
  }

  logout(): void {
    this.auth.logout();
    location.href = '/login';
  }
}
