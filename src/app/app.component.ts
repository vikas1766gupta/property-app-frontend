import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { AuthService } from "./core/auth/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="top-nav" *ngIf="!isDashboardRoute()">
      <a routerLink="/properties" class="brand" aria-label="PropertyHub home">
        <img src="assets/propertyhub-mark.svg" alt="" />
        <span>PropertyHub</span>
      </a>
      <div class="nav-links" [class.is-open]="mobileNavOpen">
        <a
          routerLink="/properties"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          >Browse</a
        >
        <ng-container *ngIf="auth.isLoggedIn()">
          <a
            *ngIf="auth.getRole() === 'BUSINESS'"
            routerLink="/dashboard"
            routerLinkActive="active"
            >Dashboard</a
          >
          <a
            *ngIf="auth.getRole() === 'BUYER'"
            routerLink="/saved"
            routerLinkActive="active"
            >Saved</a
          >
          <a
            *ngIf="auth.getRole() === 'ADMIN'"
            routerLink="/admin"
            routerLinkActive="active"
            >Admin</a
          >
        </ng-container>
      </div>
      <button
        class="mobile-nav-toggle"
        type="button"
        (click)="mobileNavOpen = !mobileNavOpen"
        [attr.aria-expanded]="mobileNavOpen"
        aria-label="Toggle navigation"
      >
        <span></span><span></span><span></span>
      </button>
      <details
        class="account-menu"
        *ngIf="auth.isLoggedIn(); else accountGuest"
      >
        <summary class="account-chip">
          <span class="account-avatar">{{
            auth.getRole()?.charAt(0) || "P"
          }}</span
          ><span class="account-label">Account</span
          ><span aria-hidden="true">⌄</span>
        </summary>
        <div class="account-dropdown">
          <a *ngIf="auth.getRole() === 'BUYER'" routerLink="/saved"
            >Saved properties</a
          ><a *ngIf="auth.getRole() === 'BUSINESS'" routerLink="/dashboard"
            >Business dashboard</a
          ><a *ngIf="auth.getRole() === 'ADMIN'" routerLink="/admin"
            >Admin panel</a
          ><button type="button" (click)="logout()">Log out</button>
        </div>
      </details>
      <ng-template #accountGuest
        ><details class="account-menu">
          <summary class="account-chip">
            <span class="account-avatar">P</span
            ><span class="account-label">Account</span
            ><span aria-hidden="true">⌄</span>
          </summary>
          <div class="account-dropdown">
            <a routerLink="/login">Log in</a
            ><a routerLink="/register">Create account</a>
          </div>
        </details></ng-template
      >
    </nav>
    <router-outlet />
  `,
  styles: [
    `
      .top-nav {
        position: sticky;
        z-index: 20;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-4);
        min-height: 4.5rem;
        padding: var(--space-3) max(var(--space-4), calc((100vw - 78rem) / 2));
        border-bottom: 1px solid var(--color-line);
        background: var(--color-surface);
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        color: var(--color-ink);
        font: 700 var(--text-lg) var(--font-display);
        text-decoration: none;
        white-space: nowrap;
      }
      .brand img {
        width: 2rem;
        height: 2rem;
      }
      .nav-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--space-2) var(--space-5);
      }
      .nav-links a {
        position: relative;
        text-decoration: none;
        color: var(--color-muted);
        font-size: var(--text-sm);
        font-weight: 600;
      }
      .nav-links a.active {
        color: var(--color-brand);
      }
      .nav-links a.active::after {
        position: absolute;
        right: 0;
        bottom: -1.55rem;
        left: 0;
        height: 2px;
        background: var(--color-brand);
        content: "";
      }
      .account-chip,
      .account-login {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: var(--color-muted);
        font-size: var(--text-sm);
        font-weight: 600;
        text-decoration: none;
      }
      .account-menu {
        position: relative;
      }
      .account-chip {
        list-style: none;
        cursor: pointer;
      }
      .account-chip::-webkit-details-marker {
        display: none;
      }
      .account-dropdown {
        position: absolute;
        z-index: 30;
        top: calc(100% + 0.65rem);
        right: 0;
        display: grid;
        min-width: 11rem;
        padding: 0.4rem;
        border: 1px solid var(--color-line);
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 12px 30px rgb(23 43 36 / 14%);
      }
      .account-dropdown a,
      .account-dropdown button {
        padding: 0.6rem 0.7rem;
        border: 0;
        color: var(--color-ink);
        background: transparent;
        font: inherit;
        font-size: 0.82rem;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
      }
      .account-dropdown a:hover,
      .account-dropdown button:hover {
        border-radius: 5px;
        color: var(--color-brand);
        background: var(--color-brand-soft);
      }
      .account-avatar {
        display: grid;
        width: 2rem;
        height: 2rem;
        place-items: center;
        border-radius: 50%;
        color: #fff;
        background: var(--color-brand);
        font-size: 0.75rem;
      }
      .mobile-nav-toggle {
        display: none;
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .mobile-nav-toggle span {
        display: block;
        width: 1.4rem;
        height: 2px;
        margin: 4px 0;
        background: var(--color-ink);
      }
      .nav-links a:hover {
        color: var(--color-brand);
      }
      @media (max-width: 640px) {
        .top-nav {
          flex-wrap: wrap;
        }
        .mobile-nav-toggle {
          display: block;
          margin-left: auto;
        }
        .account-chip,
        .account-login {
          order: 3;
        }
        .nav-links {
          display: none;
          width: 100%;
          justify-content: flex-start;
          gap: var(--space-4);
          padding-top: var(--space-2);
        }
        .nav-links.is-open {
          display: flex;
        }
        .nav-links a.active::after {
          bottom: -0.35rem;
        }
      }
    `,
  ],
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  mobileNavOpen = false;

  logout(): void {
    this.auth.logout();
    this.router.navigate(["/properties"]);
  }

  isDashboardRoute(): boolean {
    return (
      this.router.url === "/dashboard" ||
      this.router.url.startsWith("/dashboard/")
    );
  }
}
