import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ProjectService } from "../../core/services/project.service";
import { Project } from "../../shared/models/project.model";

@Component({
  selector: "app-project-listing",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./project-listing.component.html",
  styleUrl: "./project-listing.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectListingComponent {
  private readonly service = inject(ProjectService);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  filters = { city: "", locality: "", propertyType: "", possessionStatus: "" };
  constructor() {
    this.search();
  }
  search(): void {
    this.loading.set(true);
    this.service.search(this.filters).subscribe({
      next: (result) => {
        this.projects.set(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Projects could not be loaded.");
        this.loading.set(false);
      },
    });
  }
}
