import { NgClass } from '@angular/common';
import { booleanAttribute, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-form-slide-toggle',
  imports: [MatSlideToggle, NgClass],
  templateUrl: './form-slide-toggle.component.html',
  styleUrl: './form-slide-toggle.component.scss',
})
export class FormSlideToggleComponent {
  @Input() public label: string = '';
  @Input() public isEditable: boolean = true;
  @Input({ transform: booleanAttribute }) public checked: boolean = false;
  @Output() toggleChange = new EventEmitter<boolean>();

  public onToggleChange(event: any): void {
    this.toggleChange.emit(event.checked); // Emitir el estado actual (true o false)
  }
}
