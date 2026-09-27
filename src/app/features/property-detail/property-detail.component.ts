import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { LeadService } from '../../core/services/lead.service';
import { Property } from '../../shared/models/property.model';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PropertyService);
  private readonly leadService = inject(LeadService);

  readonly property = signal<Property | null>(null);
  readonly activeImage = signal(0);
  readonly loading = signal(true);
  private touchStartX: number | null = null;

  readonly leadName = signal('');
  readonly leadContact = signal('');
  readonly leadMessage = signal('');
  readonly leadSent = signal(false);
  readonly leadError = signal<string | null>(null);
  readonly leadSubmitting = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.propertyService.getById(id).subscribe((property) => {
      this.property.set(property);
      this.loading.set(false);
    });
  }

  selectImage(index: number): void {
    const imageCount = this.property()?.images.length ?? 0;
    if (imageCount === 0) return;
    this.activeImage.set((index + imageCount) % imageCount);
  }

  previousImage(): void {
    this.selectImage(this.activeImage() - 1);
  }

  nextImage(): void {
    this.selectImage(this.activeImage() + 1);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    this.touchStartX = null;
    if (Math.abs(deltaX) < 40) return;
    deltaX > 0 ? this.previousImage() : this.nextImage();
  }

  submitLead(): void {
    const property = this.property();
    if (!property || this.leadSubmitting()) return;
    this.leadError.set(null);
    this.leadSubmitting.set(true);
    this.leadService
      .submit({
        propertyId: property.id,
        name: this.leadName(),
        contact: this.leadContact(),
        message: this.leadMessage(),
      })
      .subscribe({
        next: () => {
          this.leadSubmitting.set(false);
          this.leadSent.set(true);
        },
        error: () => {
          this.leadSubmitting.set(false);
          this.leadError.set('Could not send your inquiry — please try again.');
        },
      });
  }
}
