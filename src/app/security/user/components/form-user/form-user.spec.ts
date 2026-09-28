import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormUser } from './form-user';

describe('FormUser', () => {
  let component: FormUser;
  let fixture: ComponentFixture<FormUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormUser],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FormUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allows administrative accounts without personal document, birth date, or address', () => {
    component.form.reset();
    component.form.patchValue({
      nombres: 'Sissy',
      apellidos: 'Fernandez',
      username: 'sfernandeza',
      correo: 'sfernandeza@jne.gob.pe',
      roles: [{ key: 'monitor-role', value: 'Monitor' }],
    });

    expect(component.form.controls.numeroDocumento.hasError('required')).toBeFalse();
    expect(component.form.controls.fechaNacimiento.hasError('required')).toBeFalse();
    expect(component.form.controls.direccion.hasError('required')).toBeFalse();
    expect(component.form.valid).toBeTrue();
  });

  it('keeps length validation for optional administrative profile fields', () => {
    component.form.controls.numeroDocumento.setValue('1'.repeat(21));
    component.form.controls.direccion.setValue('A'.repeat(101));

    expect(component.form.controls.numeroDocumento.hasError('maxlength')).toBeTrue();
    expect(component.form.controls.direccion.hasError('maxlength')).toBeTrue();
  });
});
