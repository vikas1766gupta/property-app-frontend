import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonDirective } from '../../../shared/ui/button.directive';
import { UiCardComponent } from '../../../shared/ui/card.component';
import { UiInputDirective } from '../../../shared/ui/input.directive';
import { UiToastComponent } from '../../../shared/ui/toast.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UiButtonDirective, UiCardComponent, UiInputDirective, UiToastComponent],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  companyName = '';
  contactPhone = '';
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.registerBusiness(this.email, this.password, this.companyName, this.contactPhone).subscribe({
      next: ({ token }) => {
        this.auth.storeToken(token);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Registration failed.');
      },
    });
  }
}
