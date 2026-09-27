import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../shared/models/project.model';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({ selector: 'app-project-detail', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './project-detail.component.html', styleUrl: './project-detail.component.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class ProjectDetailComponent {
  private readonly service = inject(ProjectService); private readonly route = inject(ActivatedRoute); private readonly title = inject(Title); private readonly meta = inject(Meta); private readonly analytics = inject(AnalyticsService);
  readonly project = signal<Project | null>(null); readonly similar = signal<Project[]>([]); readonly sent = signal(false); readonly error = signal('');
  enquiry = { name: '', contact: '', message: '' };
  constructor() { this.service.getById(this.route.snapshot.paramMap.get('id') ?? '').subscribe({ next: (result) => { this.project.set(result.project); this.similar.set(result.similar); this.title.setTitle(`${result.project.name} | Property App`); this.meta.updateTag({ name: 'description', content: `${result.project.name} in ${result.project.locality}, ${result.project.city}. Explore details and enquire with the builder.` }); this.analytics.track({ event: 'PROJECT_VIEW', projectId: result.project.id, city: result.project.city, propertyType: result.project.propertyType }); }, error: () => this.error.set('This project is not available.') }); }
  submit(): void { const project = this.project(); if (!project) return; this.service.enquire(project.id, this.enquiry).subscribe({ next: () => { this.sent.set(true); this.analytics.track({ event: 'LEAD_CREATED', projectId: project.id, city: project.city, propertyType: project.propertyType }); }, error: () => this.error.set('Your enquiry could not be sent.') }); }
}