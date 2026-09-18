import {
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  Inject,
  Injector,
  OnInit,
  Renderer2,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-wrapper',
  imports: [MatButton],
  templateUrl: './dialog-wrapper.component.html',
  styleUrl: './dialog-wrapper.component.scss',
})
export class DialogWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  public componentRef!: ComponentRef<any>;

  constructor(
    public dialogRef: MatDialogRef<DialogWrapperComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private renderer: Renderer2,
    private el: ElementRef,
    private injector: Injector,
  ) {}

  public closeDialog(): void {
    this.dialogRef.close(null);
  }

  public submitData(): void {
    if (this.componentRef.instance?.form?.valid) {
      this.dialogRef.close(this.componentRef.instance.data);
    }
    this.componentRef.instance?.form?.markAllAsTouched();

    return;
  }

  ngOnInit(): void {
    if (this.data.component) {
      this.loadComponent(this.data.component);
    }
  }

  public loadComponent(component: any) {
    this.componentRef = this.container.createComponent(component, {
      injector: this.injector,
    });

    this.componentRef.instance.data = this.data?.data;
  }

  ngAfterViewInit(): void {
    const firstWrapper = this.el.nativeElement.querySelector(
      '.Container__Simple__Content__Wrapper',
    );
    if (firstWrapper) {
      const firstElement = firstWrapper.querySelector(':first-child');
      if (firstElement) {
        this.renderer.addClass(firstElement, 'Container__Simple__Content');
      }
    }
  }
}
