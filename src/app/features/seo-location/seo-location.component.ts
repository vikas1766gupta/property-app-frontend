import { DOCUMENT, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoLocationPage, SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-seo-location',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seo-location.component.html',
  styleUrl: './seo-location.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeoLocationComponent implements OnDestroy {
  private readonly service = inject(SeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  readonly page = signal<SeoLocationPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  private structuredData?: HTMLScriptElement;

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.service.getLocation(slug).subscribe({
      next: (page) => { this.page.set(page); this.loading.set(false); this.updateMetadata(page); },
      error: () => { this.loading.set(false); this.error.set(true); this.updateNoIndex(); },
    });
  }

  private updateMetadata(page: SeoLocationPage): void {
    this.title.setTitle(`${page.title} | PropertyHub`);
    this.meta.updateTag({ name: 'description', content: page.intro });
    this.meta.updateTag({ name: 'robots', content: page.noindex ? 'noindex,follow' : 'index,follow' });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.intro });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.setCanonical(page.canonicalPath);
    this.structuredData?.remove();
    if (!page.noindex) {
      this.structuredData = this.document.createElement('script');
      this.structuredData.type = 'application/ld+json';
      this.structuredData.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: page.title, description: page.intro, numberOfItems: page.total });
      this.document.head.appendChild(this.structuredData);
    }
  }

  private updateNoIndex(): void { this.title.setTitle('Property location not found | PropertyHub'); this.meta.updateTag({ name: 'robots', content: 'noindex,follow' }); }
  private setCanonical(path: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = this.document.createElement('link'); link.rel = 'canonical'; this.document.head.appendChild(link); }
    link.href = `${this.document.location.origin}${path}`;
  }
  ngOnDestroy(): void { this.structuredData?.remove(); }
}
