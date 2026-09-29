import { signal } from "@angular/core";
import { fakeAsync, TestBed, tick, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { AuthService } from "../../core/auth/auth.service";
import { FavoriteService } from "../../core/services/favorite.service";
import { PropertyService } from "../../core/services/property.service";
import { Property } from "../../shared/models/property.model";
import { PropertyListingComponent } from "./property-listing.component";

describe("PropertyListingComponent", () => {
  const property: Property = {
    id: "property-1",
    businessId: "business-1",
    listingType: "RENT",
    status: "PUBLISHED",
    verificationStatus: "PENDING",
    title: "Sunny city apartment",
    description: "A bright apartment close to the park and transit.",
    price: 1200,
    currency: "INR",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    addressLine: "1 Main Road",
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 850,
    furnishingStatus: null,
    amenities: [],
    images: ["https://images.example/property-1.jpg"],
    createdAt: new Date().toISOString(),
  };
  let toggleFavorite: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    toggleFavorite = jasmine.createSpy("toggle").and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [PropertyListingComponent],
      providers: [
        provideRouter([]),
        {
          provide: PropertyService,
          useValue: {
            search: jasmine
              .createSpy("search")
              .and.returnValue(of({ items: [property], total: 1 })),
            listSavedSearches: jasmine
              .createSpy("listSavedSearches")
              .and.returnValue(of([])),
            listNotifications: jasmine
              .createSpy("listNotifications")
              .and.returnValue(of([])),
          },
        },
        {
          provide: FavoriteService,
          useValue: {
            favorites: signal([]),
            favoriteIds: signal(new Set<string>()),
            pendingIds: signal(new Set<string>()),
            loading: signal(false),
            isFavorited: jasmine
              .createSpy("isFavorited")
              .and.returnValue(false),
            isPending: jasmine.createSpy("isPending").and.returnValue(false),
            loadMine: jasmine.createSpy("loadMine").and.returnValue(of([])),
            toggle: toggleFavorite,
          },
        },
        { provide: AuthService, useValue: { getRole: () => "BUYER" } },
      ],
    }).compileComponents();
  }));

  it("renders a property card and allows a buyer to toggle its favorite", fakeAsync(() => {
    const fixture = TestBed.createComponent(PropertyListingComponent);
    fixture.detectChanges();
    tick(301);
    fixture.detectChanges();

    const card: HTMLElement | null =
      fixture.nativeElement.querySelector(".property-card");
    const heart: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(".favorite-toggle");
    expect(card?.textContent).toContain("Sunny city apartment");
    expect(heart).not.toBeNull();
    heart?.click();
    expect(toggleFavorite).toHaveBeenCalledWith(property);
    fixture.destroy();
  }));
});
