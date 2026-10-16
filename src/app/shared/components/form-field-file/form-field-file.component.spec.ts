import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { FormFieldFileComponent } from './form-field-file.component';

describe('FormFieldFileComponent', () => {
  let component: FormFieldFileComponent;
  let fixture: ComponentFixture<FormFieldFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldFileComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldFileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('labels a missing historical file without a download action', () => {
    component.unavailableFileName = 'legacy\\attendance.pdf';
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('attendance.pdf');
    expect(fixture.nativeElement.textContent).toContain('Archivo histórico no disponible');
    expect(fixture.nativeElement.querySelector('button[title="Descargar"]')).toBeNull();

  });
});
