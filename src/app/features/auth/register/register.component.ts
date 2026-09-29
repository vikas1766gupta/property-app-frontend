import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";
import { UiButtonDirective } from "../../../shared/ui/button.directive";
import { UiCardComponent } from "../../../shared/ui/card.component";
import { UiInputDirective } from "../../../shared/ui/input.directive";
import { UiToastComponent } from "../../../shared/ui/toast.component";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiButtonDirective,
    UiCardComponent,
    UiInputDirective,
    UiToastComponent,
  ],
  templateUrl: "./register.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .account-type-switch {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.35rem;
        padding: 0.25rem;
        border: 1px solid var(--color-line);
        border-radius: var(--radius-sm);
        background: var(--color-surface-soft);
      }
      .account-type-switch button {
        min-height: 2.7rem;
        padding: 0.45rem 0.55rem;
        border: 1px solid transparent;
        border-radius: 4px;
        color: var(--color-muted);
        background: transparent;
        font: inherit;
        font-size: var(--text-sm);
        font-weight: 650;
        cursor: pointer;
      }
      .account-type-switch button.active {
        border-color: var(--color-brand);
        color: var(--color-brand-strong);
        background: var(--color-surface);
        box-shadow: var(--shadow-card);
      }
      .account-type-switch button:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
      }
    `,
  ],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = "";
  password = "";
  accountType: "BUYER" | "BUSINESS" = "BUYER";
  companyName = "";
  contactPhone = "";
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    const registration =
      this.accountType === "BUYER"
        ? this.auth.registerBuyer(this.email, this.password)
        : this.auth.registerBusiness(
            this.email,
            this.password,
            this.companyName,
            this.contactPhone,
          );
    registration.subscribe({
      next: ({ token }) => {
        this.auth.storeToken(token);
        this.loading.set(false);
        this.router.navigate([
          this.accountType === "BUYER" ? "/properties" : "/dashboard",
        ]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? "Registration failed.");
      },
    });
  }
}
