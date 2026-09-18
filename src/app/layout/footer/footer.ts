import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  faFacebookF,
  faTwitter,
  faInstagram,
  faLinkedin,
  faThreads,
  faTiktok,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FaIconComponent,
    FontAwesomeModule,
    MatTooltipModule,
    NgOptimizedImage,
  ],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class Footer {
  protected year = new Date().getFullYear();

  protected social = [
    {
      name: 'facebook',
      url: 'https://www.facebook.com/JNE.Peru',
      icon: faFacebookF,
      color: '#1877F2',
    },
    {
      name: 'instagram',
      url: 'https://www.instagram.com/jne.peru',
      icon: faInstagram,
      color: '#E1306C',
    },
    {
      name: 'linkedin',
      url: 'https://www.linkedin.com/company/jurado-nacional-de-elecciones',
      icon: faLinkedin,
      color: '#0A66C2',
    },
    { name: 'ticktock', url: 'https://www.tiktok.com/@jne.peru', icon: faTiktok, color: '#000000' },
    { name: 'x', url: 'https://x.com/jne_peru', icon: faTwitter, color: '#1DA1F2' },
    {
      name: 'youtube',
      url: 'https://www.youtube.com/user/JNETV6',
      icon: faYoutube,
      color: '#FF0000',
    },
    { name: 'thread', url: 'https://www.threads.com/@jne.peru', icon: faThreads, color: '#000000' },
  ];
}
