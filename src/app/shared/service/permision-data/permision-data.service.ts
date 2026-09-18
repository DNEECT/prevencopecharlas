import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuItemResponse } from '../../../security/authentication/interface/authentication';

@Injectable({
  providedIn: 'root',
})
export class PermisionDataService {
  private readonly dataSubject = new BehaviorSubject<MenuItemResponse[] | null>(null);

  public setData(data: MenuItemResponse[]): void {
    this.dataSubject.next(data);
  }

  public getCurrentData(): MenuItemResponse[] | null {
    return this.dataSubject.getValue();
  }

  public clearData(): void {
    this.dataSubject.next(null);
  }
}
