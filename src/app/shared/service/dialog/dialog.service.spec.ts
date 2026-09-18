import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { of } from 'rxjs';
import { DialogBaseComponent } from '../../components/dialog-base/dialog-base.component';
import { DialogLoadingComponent } from '../../components/dialog-loading/dialog-loading.component';
import { DialogService } from './dialog.service';
import { DialogDataDto } from '../../interface/dialog.interface';

describe('DialogService', () => {
  let dialogBaseComponent: DialogBaseComponent;
  let fixtureDialogBaseComponent: ComponentFixture<DialogBaseComponent>;

  let dialogLoadingComponent: DialogLoadingComponent;
  let fixtureDialogLoadingComponent: ComponentFixture<DialogLoadingComponent>;

  let service: DialogService;
  let dialog: MatDialog;
  const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of({}), close: null });
  dialogRefSpyObj.componentInstance = { body: '' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogBaseComponent, DialogLoadingComponent],
      imports: [MatDialogModule],
      providers: [
        DialogService,
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            tittle: 'Test Title',
            content: 'Test Content',
          } as DialogDataDto,
        },
      ],
    }).compileComponents();
    service = TestBed.inject(DialogService);
    dialog = TestBed.inject(MatDialog);
  });

  beforeEach(() => {
    fixtureDialogBaseComponent = TestBed.createComponent(DialogBaseComponent);
    dialogBaseComponent = fixtureDialogBaseComponent.componentInstance;
    fixtureDialogBaseComponent.detectChanges();

    fixtureDialogLoadingComponent = TestBed.createComponent(DialogLoadingComponent);
    dialogLoadingComponent = fixtureDialogLoadingComponent.componentInstance;
    fixtureDialogLoadingComponent.detectChanges();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open base dialog', () => {
    spyOn(dialog, 'open').and.returnValue(dialogRefSpyObj);
    service.openDialogConfirmacion('Test Title', 'Test Content');
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open base dialog component', () => {
    expect(dialogBaseComponent).toBeTruthy();
  });

  it('should open base dialog widt dialogParams', () => {
    spyOn(dialog, 'open').and.returnValue(dialogRefSpyObj);
    service.openDialogConfirmacion('Test Title', 'Test Content');
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open loading window', () => {
    spyOn(dialog, 'open').and.returnValue(dialogRefSpyObj);
    service.openLoadingWindow();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open loading window components', () => {
    expect(dialogLoadingComponent).toBeTruthy();
  });

  it('should open loading window data empty', () => {
    spyOn(dialog, 'open').and.returnValue(dialogRefSpyObj);
    service.openLoadingWindow('', 'tittle');
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should close dialog', () => {
    spyOn(dialog, 'getDialogById').and.returnValue(dialogRefSpyObj);
    service.closeDialog();
    expect(dialog.getDialogById).toHaveBeenCalled();
  });

  it('should close dialog data empty', () => {
    spyOn(dialog, 'getDialogById').and.returnValue(dialogRefSpyObj);
    service.closeDialog('');
    expect(dialog.getDialogById).toHaveBeenCalled();
  });

  it('should close all dialogs', () => {
    spyOn(dialog, 'closeAll').and.callThrough();
    service.closeAllDialogs();
    expect(dialog.closeAll).toHaveBeenCalled();
  });
});
