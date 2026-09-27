import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LeadService } from '../../core/services/lead.service';
import { PaymentService } from '../../core/services/payment.service';
import { PropertyService } from '../../core/services/property.service';
import { BusinessDashboardComponent } from './business-dashboard.component';

describe('BusinessDashboardComponent listing validation', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BusinessDashboardComponent],
      providers: [
        {
          provide: PropertyService,
          useValue: {
            myListings: () => of([]),
            freeListingsRemaining: () => of({ remaining: 3 }),
          },
        },
        { provide: PaymentService, useValue: { history: () => of([]) } },
        { provide: LeadService, useValue: { mine: () => of([]) } },
        { provide: AuthService, useValue: { getRole: () => 'BUSINESS', logout: () => undefined } },
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
});