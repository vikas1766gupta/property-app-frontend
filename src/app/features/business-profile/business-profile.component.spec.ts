import { Component } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BusinessService } from '../../core/services/business.service';
import { BusinessProfileComponent } from './business-profile.component';

const profile = {
  id: 'business-1', accountType: 'BROKER' as const, displayName: 'Asha Realty', companyName: 'Asha Realty Pvt Ltd',
  profileImage: null, bio: 'Local property advisor', yearsOfExperience: 8, phone: '+919999999999',
  email: 'asha@example.com', website: 'https://asha.example.com', verificationStatus: 'VERIFIED' as const,
  city: 'Pune', servedLocalities: ['Baner'], createdAt: '', updatedAt: '',
  stats: { activePropertyCount: 1, saleListingsCount: 1, rentalListingsCount: 0, commercialListingsCount: 0, projectsCount: 0, activeProjectsCount: 0 },
};

@Component({ template: '' })
class HostComponent {}

describe('BusinessProfileComponent', () => {
  it('renders a broker profile and its listings', waitForAsync(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessProfileComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'business-1' } } } },
        { provide: BusinessService, useValue: { getById: () => of(profile), properties: () => of([{ id: 'property-1', title: 'City home', listingType: 'SALE', city: 'Pune', state: 'Maharashtra', price: 100, currency: 'INR', images: [] }]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BusinessProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Asha Realty');
    expect(fixture.nativeElement.textContent).toContain('Verified business');
    expect(fixture.nativeElement.textContent).toContain('City home');
    fixture.destroy();
  }));

  it('renders an error state when the profile cannot load', waitForAsync(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessProfileComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'missing' } } } },
        { provide: BusinessService, useValue: { getById: () => throwError(() => new Error('offline')) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BusinessProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Profile unavailable');
    fixture.destroy();
  }));
});
