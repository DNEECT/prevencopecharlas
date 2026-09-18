import { DatePipe, NgStyle } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSort, MatSortHeader, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { HeaderTable, MenuItems } from '../../interface/header-table.interface';
import { MatTooltip } from '@angular/material/tooltip';
import {
  PermisosDetalleResponse,
  PermisosResponse,
} from '../../../security/permission/interface/permission';
import { FormSlideToggleComponent } from '@shared/components/form-slide-toggle/form-slide-toggle.component';

@Component({
  selector: 'app-table-paginate',
  imports: [
    MatTableModule,
    MatSortModule,
    MatProgressSpinner,
    MatPaginator,
    MatSortHeader,
    MatSort,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    NgStyle,
    DatePipe,
    MatTooltip,
    FormSlideToggleComponent,
  ],
  templateUrl: './table-paginate.component.html',
  styleUrl: './table-paginate.component.scss',
})
export class TablePaginateComponent implements OnInit, AfterViewChecked {
  private readonly elRef: ElementRef = inject(ElementRef);
  private readonly renderer: Renderer2 = inject(Renderer2);

  private _headers: HeaderTable[] = [];
  public ids: string[] = [];

  @Input()
  set headers(value: HeaderTable[]) {
    this._headers = value;
    this.ids = this._headers.map((header) => header.id); // Actualiza `ids` cada vez que cambia `headers`
  }

  get headers(): HeaderTable[] {
    return this._headers;
  }

  @Input() dataSource: unknown[] = [];
  @Input() loading: boolean = false;
  @Input() enablePagination: boolean = true;
  @Input() pageSize: number = 5;
  @Input() pageIndex: number = 0;
  @Input() length: number = 100;
  @Output() pageChange: EventEmitter<{ pageEvent: PageEvent; sort: Sort | null }> =
    new EventEmitter();
  @Output() optionSelect: EventEmitter<{ menuItem: MenuItems; element: any }> = new EventEmitter();

  public currentSort: Sort | null = null;
  public pageSizeOptions: number[] = [5, 10, 25, 100];

  ngOnInit(): void {
    this.adjustTableHeight();
  }

  ngAfterViewChecked(): void {
    this.adjustTableHeight();
  }

  public getLabelForId(id: string): string {
    const header = this._headers.find((header) => header.id === id);

    return header ? header.label : '';
  }

  public getSortForId(id: string): string {
    const header = this._headers.find((header) => header.id === id);

    return header ? header.order! : '';
  }

  public getDataTypeForId(id: string): string {
    const header = this._headers.find((header) => header.id === id);

    return header ? header.datatype : '';
  }

  public getMaxWidthForId(id: string): string {
    const header = this._headers.find((header) => header.id === id);

    return header ? (header.maxwidth ? header.maxwidth : '500px') : '300px';
  }

  public handlePageEvent($event: PageEvent): void {
    this.pageIndex = $event.pageIndex;
    this.pageSize = $event.pageSize;
    this.length = $event.length;
    this.pageChange.emit({ pageEvent: $event, sort: this.currentSort });
  }

  public announceSortChange($event: Sort): void {
    this.currentSort = $event;
    const paginationData: PageEvent = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length,
    };
    this.pageChange.emit({ pageEvent: paginationData, sort: this.currentSort });
  }

  public onMenuItemClick(menuItem: MenuItems, element: unknown): void {
    this.optionSelect.emit({ menuItem, element });
  }

  public dataEmpty(): boolean {
    return this.dataSource && !(this.dataSource?.length > 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.adjustTableHeight();
  }

  public getCampoArrayForId(id: string): string {
    const header = this._headers.find((header) => header.id === id);
    return header ? header.campoArrayObjeto! : '';
  }

  public getPermiso(element: PermisosResponse, id: string): PermisosDetalleResponse | null {
    return element.acciones.find((permiso) => permiso.codigoAccion === id) ?? null;
  }

  private adjustTableHeight(): void {
    const tableWrap = this.elRef.nativeElement.querySelector('.table-wrap');
    if (this.enablePagination) {
      if (tableWrap && typeof tableWrap.getBoundingClientRect === 'function') {
        const offsetTop = tableWrap.getBoundingClientRect().top;
        const availableHeight = window.innerHeight - offsetTop - 60; // Restar 20px de margen
        this.renderer.setStyle(tableWrap, 'max-height', `${availableHeight}px`);
      }
    }
  }
}
