import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { BreadcrumbsComponent } from '@shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, Footer, BreadcrumbsComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {}
