import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  public setItem(key: string, value: any): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  public getItem(key: string): any | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }

    return null;
  }

  public removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  public clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }
}
