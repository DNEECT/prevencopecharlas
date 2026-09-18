import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@shared/service/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly renderer: Renderer2 = inject(Renderer2);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.themeService.setRenderer(this.renderer);
    }
  }
}
