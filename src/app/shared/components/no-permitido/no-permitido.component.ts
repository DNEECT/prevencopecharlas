import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-no-permitido',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './no-permitido.component.html',
  styleUrls: ['./no-permitido.component.scss'],
})
export class NoPermitidoComponent {
  constructor(private router: Router) {}

  public backHome() {
    this.router.navigate(['/']).then();
  }
}
