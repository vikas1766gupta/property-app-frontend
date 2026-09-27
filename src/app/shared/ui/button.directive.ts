import { Directive, HostBinding, Input } from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

@Directive({
  selector: 'button[uiButton], a[uiButton]',
  standalone: true,
})
export class UiButtonDirective {
  private variant: UiButtonVariant = 'secondary';

  @Input() set uiButton(value: UiButtonVariant | '') {
    this.variant = value || 'secondary';
  }

  @HostBinding('class.ui-button') readonly baseClass = true;

  @HostBinding('class.ui-button--primary') get primary(): boolean {
    return this.variant === 'primary';
  }

  @HostBinding('class.ui-button--secondary') get secondary(): boolean {
    return this.variant === 'secondary';
  }

  @HostBinding('class.ui-button--danger') get danger(): boolean {
    return this.variant === 'danger';
  }

  @HostBinding('class.ui-button--quiet') get quiet(): boolean {
    return this.variant === 'quiet';
  }
}