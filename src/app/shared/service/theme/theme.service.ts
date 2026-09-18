import { inject, Injectable, Renderer2 } from '@angular/core';
import { LocalStorageService } from '@shared/service/local-storage/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2 | null = null;
  public browserMode: string = '';
  public browserModeDescription: string = '';
  public darkMode: string = 'dark_mode';
  public lightMode: string = 'light_mode';
  public lightModeDescription: string = 'Modo claro';
  public darkModeDescription: string = 'Modo oscuro';

  private readonly localStorageService: LocalStorageService = inject(LocalStorageService);

  public setRenderer(renderer: Renderer2): void {
    if (typeof window !== 'undefined') {
      this.renderer = renderer;
      this.inictializeMode();
    }
  }

  public inictializeMode(): void {
    if (typeof window !== 'undefined') {
      const mode = this.localStorageService.getItem('mode');
      if (mode !== null) {
        this.browserMode = mode === this.lightMode ? this.darkMode : this.lightMode;
        this.browserModeDescription =
          mode === this.lightMode ? this.darkModeDescription : this.lightModeDescription;
        if (mode === this.darkMode || mode === this.lightMode) {
          this.renderer?.addClass(document.body, mode);
        }
      }
    }
  }

  public modeChange() {
    if (typeof window !== 'undefined') {
      if (this.browserMode === this.darkMode) {
        this.browserModeDescription = this.lightModeDescription;
        this.localStorageService.setItem('mode', this.darkMode);
        this.renderer?.addClass(document.body, this.darkMode);
        this.browserMode = this.lightMode;
      } else {
        this.browserModeDescription = this.darkModeDescription;
        this.localStorageService.setItem('mode', this.lightMode);
        this.renderer?.removeClass(document.body, this.darkMode);
        this.browserMode = this.darkMode;
      }
    }
  }

  public getMode(): string {
    return this.browserMode;
  }

  public getModeDescription(): string {
    return this.browserModeDescription;
  }

  public isDark(): boolean {
    return this.browserMode === this.darkMode;
  }
}
