import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'input[uiInput], select[uiInput], textarea[uiInput]',
  standalone: true,
})
export class UiInputDirective {
  @HostBinding('class.ui-input') readonly inputClass = true;
}