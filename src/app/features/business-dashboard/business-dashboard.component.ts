import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../core/services/property.service';
import { PaymentService, PaymentRecord } from '../../core/services/payment.service';
import { LeadService, BusinessLead } from '../../core/services/lead.service';
import { AuthService } from '../../core/auth/auth.service';
import { Property } from '../../shared/models/property.model';

declare const Stripe: any; // loaded via <script src="https://js.stripe.com/v3/"> in index.html

const STRIPE_PUBLISHABLE_KEY = 'pk_test_replace_me'; // set from your Stripe dashboard

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-dashboard.component.html',
  styleUrl: './business-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessDashboardComponent implements OnDestroy {
  private readonly propertyService = inject(PropertyService);
  private readonly paymentService = inject(PaymentService);
  private readonly leadService = inject(LeadService);
  private readonly auth = inject(AuthService);

  @ViewChild('cardElementRef') cardElementRef?: ElementRef<HTMLDivElement>;

  readonly listings = signal<Property[]>([]);
  readonly payments = signal<PaymentRecord[]>([]);
  readonly leads = signal<BusinessLead[]>([]);
  readonly leadsLoading = signal(true);
  readonly leadsError = signal<string | null>(null);
  readonly freeRemaining = signal(0);
  readonly loading = signal(true);
  readonly showCreateForm = signal(false);
  readonly editingPropertyId = signal<string | null>(null);
  readonly listingError = signal<string | null>(null);
  readonly savingListing = signal(false);
  readonly showCheckout = signal(false);
  readonly checkoutError = signal<string | null>(null);
  readonly checkoutProcessing = signal(false);

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
    imageUrls: '',
  };

  private stripe: any;
  private cardElement: any;
  private pendingPropertyId: string | null = null;

  constructor() {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.cardElement?.destroy();
  }

  refresh(): void {
    this.loading.set(true);
    this.propertyService.myListings().subscribe((listings) => {
      this.listings.set(listings);
      this.loading.set(false);
    });
    this.propertyService.freeListingsRemaining().subscribe((r) => this.freeRemaining.set(r.remaining));
    this.paymentService.history().subscribe((payments) => this.payments.set(payments));
    this.leadsLoading.set(true);
    this.leadsError.set(null);
    this.leadService.mine().subscribe({
      next: (leads) => {
        this.leads.set(leads);
        this.leadsLoading.set(false);
      },
      error: () => {
        this.leadsLoading.set(false);
        this.leadsError.set('Unable to load inquiries. Please refresh to try again.');
      },
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
      imageUrls: '',
    };
    this.showCreateForm.set(true);
  }

  editListing(property: Property): void {
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
      imageUrls: property.images.join(', '),
    };
    this.showCreateForm.set(true);
  }

  cancelListingForm(): void {
    this.showCreateForm.set(false);
    this.editingPropertyId.set(null);
    this.listingError.set(null);
  }

  private saveListing(): void {
    if (this.savingListing()) return;
    this.listingError.set(null);
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
      imageUrls: this.form.imageUrls ? this.form.imageUrls.split(',').map((u) => u.trim()) : [],
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

    this.paymentService.createIntent(propertyId).subscribe(({ clientSecret }) => {
      // Deferred so the *ngIf-rendered card container exists in the DOM first.
      setTimeout(() => this.mountStripeCard(clientSecret), 0);
    });
  }

  private mountStripeCard(clientSecret: string): void {
    if (!this.stripe) this.stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
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
        this.cardElement?.destroy();
        this.refresh();
      });
  }

  cancelCheckout(): void {
    this.showCheckout.set(false);
    this.cardElement?.destroy();
  }

  deleteListing(id: string): void {
    if (!confirm('Delete this listing?')) return;
    this.propertyService.delete(id).subscribe(() => this.refresh());
  }

  logout(): void {
    this.auth.logout();
    location.href = '/login';
  }
}
