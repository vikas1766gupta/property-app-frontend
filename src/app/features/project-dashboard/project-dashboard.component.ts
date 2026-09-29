import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProjectService } from "../../core/services/project.service";
import { Project } from "../../shared/models/project.model";

@Component({
  selector: "app-project-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./project-dashboard.component.html",
  styleUrl: "./project-dashboard.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDashboardComponent {
  private readonly service = inject(ProjectService);
  readonly projects = signal<Project[]>([]);
  readonly error = signal("");
  readonly saved = signal(false);
  readonly creating = signal(false);
  form = {
    name: "",
    description: "",
    propertyType: "Apartment",
    city: "",
    locality: "",
    address: "",
    totalUnits: 1,
    availableUnits: 1,
  };
  constructor() {
    this.load();
  }
  totalViews(): number {
    return this.projects().reduce(
      (total, project) => total + project.viewCount,
      0,
    );
  }
  totalEnquiries(): number {
    return this.projects().reduce(
      (total, project) => total + (project.enquiriesCount ?? 0),
      0,
    );
  }
  load(): void {
    this.service
      .mine()
      .subscribe({
        next: (items) => this.projects.set(items),
        error: () => this.error.set("Projects could not be loaded."),
      });
  }
  create(): void {
    this.creating.set(true);
    this.error.set("");
    this.service.create(this.form).subscribe({
      next: (project) => {
        this.projects.update((items) => [project, ...items]);
        this.saved.set(true);
        this.creating.set(false);
      },
      error: () => {
        this.error.set("Project could not be created.");
        this.creating.set(false);
      },
    });
  }
}
