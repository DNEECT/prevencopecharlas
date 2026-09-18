import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePaginateComponent } from './table-paginate.component';

describe('TablePaginateComponent', () => {
  let component: TablePaginateComponent;
  let fixture: ComponentFixture<TablePaginateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePaginateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TablePaginateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
