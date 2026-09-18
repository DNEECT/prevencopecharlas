import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsService } from '../../service/breadcrumbs/breadcrumbs-service';
import { Breadcrumbs } from '@shared/interface/breadcrumbs.interface';
import { MatIcon } from '@angular/material/icon';
import { ThemeService } from '@shared/service/theme/theme.service';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink, MatIcon, MatIconButton],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
})
export class BreadcrumbsComponent implements OnInit {
  private readonly breadcrumbsService: BreadcrumbsService = inject(BreadcrumbsService);
  private readonly themeService: ThemeService = inject(ThemeService);

  public darkMode = false;
  public mode: string = '';
  public modeDescription: string = '';

  public root: Breadcrumbs | null = null;
  public paths: Breadcrumbs[] = [];

  ngOnInit(): void {
    this.breadcrumbsService.listen(this);
    if (typeof window !== 'undefined') {
      this.mode = this.themeService.getMode();
      this.modeDescription = this.themeService.getModeDescription();
      this.darkMode = this.themeService.isDark();
    }
  }

  public modeChange() {
    if (typeof window !== 'undefined') {
      this.themeService.modeChange();
      this.mode = this.themeService.getMode();
      this.modeDescription = this.themeService.getModeDescription();
      this.darkMode = this.themeService.isDark();
    }
  }
}
