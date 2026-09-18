export interface DialogUpload {
  tittle: string;
  acceptedTypes: string;
  template: string;
}

export interface DialogLoadingDto {
  tittle: string;
  content: string;
}

export interface DialogActionsDataDto {
  name: string;
  returnValue?: any;
  style?: string;
}

export interface DialogDataDto {
  tittle: string;
  content: string;
  icon: string;
  color?: '#db4437' | '#f5a623' | '#67b930';
  actions: DialogActionsDataDto[];
}

export interface DialogParams {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  hasBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string[];
  disableClose?: boolean;
  closeOnNavigation?: boolean;
}
