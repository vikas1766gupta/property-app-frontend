export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'SOLD_OUT' | 'SUSPENDED' | 'COMPLETED';
export type ReraStatus = 'PENDING' | 'VERIFIED' | 'NOT_APPLICABLE' | 'REJECTED';
export type ProjectMediaType = 'GALLERY' | 'FLOOR_PLAN' | 'BROCHURE' | 'SITE_PLAN';

export interface ProjectMedia { id: string; url: string; mediaType: ProjectMediaType; sortOrder: number; }
export interface Project {
  id: string; builderId: string; name: string; slug: string; description: string; propertyType: string; city: string; locality: string; address: string;
  latitude: number | null; longitude: number | null; priceFrom: number | null; priceTo: number | null; areaFrom: number | null; areaTo: number | null;
  totalUnits: number; availableUnits: number; possessionDate: string | null; status: ProjectStatus; reraNumber: string | null; reraStatus: ReraStatus;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'; viewCount: number; amenities: string[]; media: ProjectMedia[]; enquiriesCount?: number;
  builder?: { id: string; name: string; profileImage: string | null; verificationStatus: string }; createdAt: string; updatedAt: string;
}
export interface ProjectSearchResult { items: Project[]; total: number; }