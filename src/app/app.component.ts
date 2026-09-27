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
        padding: 0.9rem 1.2rem;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
      .brand {
        font-weight: 700;
        text-decoration: none;
        color: #1a1a2e;
      }
      .nav-links {
        display: flex;
        gap: 1rem;
      }
      .nav-links a {
        text-decoration: none;
        color: #444;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
}
