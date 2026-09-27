export type ListingType = 'RENT' | 'SALE';
export type ListingStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'PUBLISHED' | 'FLAGGED' | 'REMOVED';

export interface PropertyImageReference {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface PropertyImageInput {
  id: string;
  isCover: boolean;
}

export interface Property {
  id: string;
  businessId: string;
  listingType: ListingType;
  status?: ListingStatus;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  state: string;
  country: string;
  addressLine: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  furnishingStatus: string | null;
  amenities: string[];
  images: string[];
  imageRefs?: PropertyImageReference[];
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface PropertySearchFilters {
  city?: string;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  pageSize?: number;
}

export type SavedSearchFilters = Omit<PropertySearchFilters, 'page' | 'pageSize'>;

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SavedSearchFilters;
  notifyOnMatch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyNotification {
  id: string;
  userId: string;
  propertyId: string | null;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface PropertySearchResult {
  items: Property[];
  total: number;
}
