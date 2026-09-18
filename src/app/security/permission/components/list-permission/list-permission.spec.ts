import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPermission } from './list-permission';

describe('ListPermission', () => {
  let component: ListPermission;
  let fixture: ComponentFixture<ListPermission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPermission],
    }).compileComponents();

    fixture = TestBed.createComponent(ListPermission);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
