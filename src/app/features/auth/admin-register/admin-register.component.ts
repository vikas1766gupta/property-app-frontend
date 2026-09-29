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
  selector: "app-admin-register",
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
  templateUrl: "./admin-register.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = "";
  password = "";
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.registerAdmin(this.email, this.password).subscribe({
      next: ({ token }) => {
        this.auth.storeToken(token);
        this.loading.set(false);
        this.router.navigate(["/admin"]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? "Admin registration failed.");
      },
    });
  }
}
