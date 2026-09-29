import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FavoriteService } from "../../core/services/favorite.service";
import { Property } from "../../shared/models/property.model";
import { UiButtonDirective } from "../../shared/ui/button.directive";
import { UiCardComponent } from "../../shared/ui/card.component";
import { UiEmptyStateComponent } from "../../shared/ui/empty-state.component";
import { UiSkeletonComponent } from "../../shared/ui/skeleton.component";
import { UiToastComponent } from "../../shared/ui/toast.component";

@Component({
  selector: "app-saved-properties",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonDirective,
    UiCardComponent,
    UiEmptyStateComponent,
    UiSkeletonComponent,
    UiToastComponent,
  ],
  templateUrl: "./saved-properties.component.html",
  styleUrl: "./saved-properties.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedPropertiesComponent {
  readonly favoriteService = inject(FavoriteService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.favoriteService.loadMine().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set("Saved properties could not be loaded. Try again.");
      },
    });
  }

  unfavorite(property: Property): void {
    this.error.set(null);
    this.favoriteService.toggle(property).subscribe({
      error: () =>
        this.error.set(
          "Could not remove this property. Your saved list was restored.",
        ),
    });
  }
}
