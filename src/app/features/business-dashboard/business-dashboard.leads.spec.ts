import { TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/services/business.service';
import { LeadService } from '../../core/services/lead.service';
import { PaymentService } from '../../core/services/payment.service';
import { PromotionService } from '../../core/services/promotion.service';
import { PropertyService } from '../../core/services/property.service';
import { BusinessDashboardComponent } from './business-dashboard.component';
import { AnalyticsService } from '../../core/services/analytics.service';

const lead = {
  id: 'lead-1', propertyId: 'property-1', propertyTitle: 'Central home', propertyCity: 'Pune', name: 'Buyer', contact: 'buyer@example.com', message: 'Interested', createdAt: '',
  status: 'NEW' as const, assignedTo: null, notes: null, nextFollowUpAt: null, contactedAt: null, siteVisitAt: null, closedAt: null, source: 'website', lastUpdatedAt: '',
};

function configure(leadService: any) {
  return TestBed.configureTestingModule({
    imports: [BusinessDashboardComponent],
    providers: [
      { provide: ActivatedRoute, useValue: {} },
      { provide: PropertyService, useValue: { myListings: () => of([]), freeListingsRemaining: () => of({ remaining: 0 }) } },
      { provide: PaymentService, useValue: { history: () => of([]) } },
      { provide: PromotionService, useValue: { configs: () => of([]), mine: () => of([]) } },
      { provide: LeadService, useValue: leadService },
      { provide: BusinessService, useValue: { getById: () => of(null), updateMine: () => of(null) } },
      { provide: AuthService, useValue: { getRole: () => 'BUSINESS', getBusinessId: () => null, logout: () => undefined } },
      { provide: AnalyticsService, useValue: { business: () => of(null), builder: () => of(null) } },
    ],
  });
}

describe('BusinessDashboardComponent CRM leads', () => {
  it('loads a lead list and applies status filters', waitForAsync(async () => {
    const list = jasmine.createSpy('list').and.returnValue(of({ items: [lead], total: 1 }));
    const service = { list, summary: () => of({ total: 1, new: 1, contacted: 0, siteVisits: 0, negotiation: 0, closed: 0, invalid: 0 }) };
    await configure(service).compileComponents();
    const fixture = TestBed.createComponent(BusinessDashboardComponent);
    const component = fixture.componentInstance;

    component.leadStatusFilter.set('CONTACTED');
    component.resetLeadFilters();

    expect(component.leads()).toEqual([lead]);
    expect(list).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'CONTACTED', page: 1 }));
    fixture.destroy();
  }));

  it('updates a lead status and opens its detail', waitForAsync(async () => {
    const service = {
      list: () => of({ items: [lead], total: 1 }),
      summary: () => of({ total: 1, new: 1, contacted: 0, siteVisits: 0, negotiation: 0, closed: 0, invalid: 0 }),
      updateStatus: jasmine.createSpy('updateStatus').and.returnValue(of({ ...lead, status: 'CONTACTED' as const })),
      getById: jasmine.createSpy('getById').and.returnValue(of(lead)),
    };
    await configure(service).compileComponents();
    const fixture = TestBed.createComponent(BusinessDashboardComponent);
    const component = fixture.componentInstance;

    component.changeLeadStatus(lead, 'CONTACTED');
    component.openLead(lead);

    expect(service.updateStatus).toHaveBeenCalledWith('lead-1', 'CONTACTED');
    expect(service.getById).toHaveBeenCalledWith('lead-1');
    expect(component.selectedLead()?.id).toBe('lead-1');
    fixture.destroy();
  }));

  it('exposes a meaningful empty/error state through lead signals', waitForAsync(async () => {
    const service = { list: () => throwError(() => new Error('offline')), summary: () => throwError(() => new Error('offline')) };
    await configure(service).compileComponents();
    const fixture = TestBed.createComponent(BusinessDashboardComponent);
    const component = fixture.componentInstance;

    expect(component.leads()).toEqual([]);
    expect(component.leadsError()).toContain('Unable to load leads');
    fixture.destroy();
  }));
});
