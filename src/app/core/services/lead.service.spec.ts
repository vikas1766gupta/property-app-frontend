import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LeadService } from './lead.service';

describe('LeadService', () => {
  let service: LeadService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LeadService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('does not serialize undefined filters into the request URL', () => {
    service.list({ status: undefined, source: undefined, followUpDue: undefined, page: 1, pageSize: 10 }).subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.url.includes('/leads'));
    expect(request.request.urlWithParams).toContain('page=1');
    expect(request.request.urlWithParams).toContain('pageSize=10');
    expect(request.request.urlWithParams).not.toContain('undefined');
    request.flush({ items: [], total: 0 });
  });
});
