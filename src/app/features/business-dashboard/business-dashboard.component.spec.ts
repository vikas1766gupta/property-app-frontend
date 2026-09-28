import { TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LeadService } from '../../core/services/lead.service';
import { PaymentService } from '../../core/services/payment.service';
import { PromotionService } from '../../core/services/promotion.service';
import { PropertyService } from '../../core/services/property.service';
import { BusinessService } from '../../core/services/business.service';
import { BusinessDashboardComponent } from './business-dashboard.component';
import { AnalyticsService } from '../../core/services/analytics.service';

describe('BusinessDashboardComponent listing validation', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BusinessDashboardComponent],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: PropertyService,
          useValue: {
            myListings: () => of([]),
            freeListingsRemaining: () => of({ remaining: 3 }),
          },
        },
        { provide: PaymentService, useValue: { history: () => of([]) } },
        { provide: PromotionService, useValue: { configs: () => of([]), mine: () => of([]) } },
        { provide: LeadService, useValue: { list: () => of({ items: [], total: 0 }), summary: () => of({ total: 0, new: 0, contacted: 0, siteVisits: 0, negotiation: 0, closed: 0, invalid: 0 }) } },
        { provide: BusinessService, useValue: { getById: () => of(null), updateMine: () => of(null) } },
        { provide: AuthService, useValue: { getRole: () => 'BUSINESS', getBusinessId: () => null, logout: () => undefined } },
        { provide: AnalyticsService, useValue: { business: () => of(null), builder: () => of(null) } },
      ],
    }).compileComponents();
  }));

  it('blocks incomplete listing details and accepts valid required fields', () => {
    const fixture = TestBed.createComponent(BusinessDashboardComponent);
    const component = fixture.componentInstance;

    expect(component.isListingDetailsValid()).toBeFalse();
    expect(component.canSaveListing()).toBeFalse();

    component.form = {
      ...component.form,
      title: 'Modern rental home',
      description: 'A spacious home near schools, transit, and local shopping.',
      price: 2500,
      addressLine: '12 Main Street',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    };

    expect(component.isListingDetailsValid()).toBeTrue();
    expect(component.canSaveListing()).toBeTrue();

    component.form = { ...component.form, bedrooms: -1 };
    expect(component.isListingDetailsValid()).toBeFalse();
    fixture.destroy();
  });

  it('blocks saving while any uploaded image has not succeeded', () => {
    const fixture = TestBed.createComponent(BusinessDashboardComponent);
    const component = fixture.componentInstance;
    component.form = {
      ...component.form,
      title: 'Modern rental home',
      description: 'A spacious home near schools, transit, and local shopping.',
      price: 2500,
      addressLine: '12 Main Street',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
    };
    component.imageDrafts.set([{
      key: 'image-1',
      uploadId: null,
      name: 'home.jpg',
      previewUrl: 'blob:image-1',
      file: null,
      progress: 25,
      uploading: true,
      isCover: true,
      error: null,
    }]);

    expect(component.canSaveListing()).toBeFalse();
    fixture.destroy();
  });

  it('starts on overview and switches dashboard sections', () => {
    const fixture = TestBed.createComponent(BusinessDashboardComponent);
    const component = fixture.componentInstance;

    expect(component.activeSection()).toBe('overview');
    component.navigate('profile');
    expect(component.activeSection()).toBe('profile');
    component.navigate('settings');
    expect(component.activeSection()).toBe('settings');
    expect(component.sectionLabel()).toBe('Settings');
    fixture.destroy();
  });
});