import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BusinessService } from '../../core/services/business.service';
import { BusinessProfile, BusinessPropertySummary } from '../../shared/models/business.model';
import { UiCardComponent } from '../../shared/ui/card.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton.component';
import { UiToastComponent } from '../../shared/ui/toast.component';

@Component({
  selector: 'app-business-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, UiCardComponent, UiEmptyStateComponent, UiSkeletonComponent, UiToastComponent],
  templateUrl: './business-profile.component.html',
  styleUrl: './business-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly businessService = inject(BusinessService);
  readonly profile = signal<BusinessProfile | null>(null);
  readonly properties = signal<BusinessPropertySummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly propertiesError = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('This profile could not be found.');
      this.loading.set(false);
      return;
    }
    this.businessService.getById(id).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
        this.businessService.properties(id).subscribe({
          next: (properties) => this.properties.set(properties),
          error: () => this.propertiesError.set('Listings could not be loaded right now.'),
        });
      },
      error: () => {
        this.error.set('This profile could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  get roleLabel(): string {
    const type = this.profile()?.accountType;
    return type === 'BROKER' ? 'Broker' : type === 'BUILDER' ? 'Builder' : 'Property owner';
  }
}
