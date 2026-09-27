import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: ({ token }) => {
        this.auth.storeToken(token);
        const role = this.auth.getRole();
        this.loading.set(false);
        this.router.navigate([role === 'ADMIN' ? '/admin' : role === 'BUSINESS' ? '/dashboard' : '/properties']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid email or password.');
      },
    });
  }
}
