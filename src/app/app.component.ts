import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="top-nav">
      <a routerLink="/properties" class="brand">PropertyHub</a>
      <div class="nav-links">
        <a routerLink="/properties">Browse</a>
        <ng-container *ngIf="auth.isLoggedIn(); else loggedOut">
          <a *ngIf="auth.getRole() === 'BUSINESS'" routerLink="/dashboard">Dashboard</a>
          <a *ngIf="auth.getRole() === 'BUYER'" routerLink="/saved">Saved properties</a>
          <a *ngIf="auth.getRole() === 'ADMIN'" routerLink="/admin">Admin</a>
        </ng-container>
        <ng-template #loggedOut>
          <a routerLink="/login">Log in</a>
        </ng-template>
      </div>
    </nav>
    <router-outlet />
  `,
  styles: [
    `
      .top-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-4);
        min-height: 4.25rem;
        padding: var(--space-3) max(var(--space-4), calc((100vw - 78rem) / 2));
        border-bottom: 1px solid var(--color-line);
        background: var(--color-surface);
      }
      .brand {
        color: var(--color-ink);
        font: 400 var(--text-lg) var(--font-display);
        text-decoration: none;
        white-space: nowrap;
      }
      .nav-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--space-2) var(--space-5);
      }
      .nav-links a {
        text-decoration: none;
        color: var(--color-muted);
        font-size: var(--text-sm);
        font-weight: 600;
      }
      .nav-links a:hover {
        color: var(--color-brand);
      }
      @media (max-width: 480px) {
        .top-nav { align-items: flex-start; flex-direction: column; gap: var(--space-2); }
        .nav-links { justify-content: flex-start; gap: var(--space-2) var(--space-4); }
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
