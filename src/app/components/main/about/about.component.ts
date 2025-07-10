import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, finalize, tap, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AboutPage, PagesService } from "../service/page.service";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { RouterLink } from "@angular/router";
import { SEOService } from "../../../shared/services/seo.service";

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly pagesService = inject(PagesService);
  private readonly toastr = inject(ToastrService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seoService = inject(SEOService);

  private subscription?: Subscription;

  protected readonly aboutPage = signal<AboutPage | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);

  ngOnInit(): void {
    this.updateAboutSEO();
    this.loadAboutPage();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateAboutSEO(): void {
    this.seoService.updateSEO({
      title: 'About Us - NetNest | Our Story and Mission',
      description: 'Learn about NetNest\'s mission to provide premium products and excellent service. Discover our values, commitment to quality, and dedication to customer satisfaction.',
      keywords: 'about us, NetNest, company, mission, values, quality, customer service, e-commerce',
      type: 'website',
      url: 'https://yourdomain.com/about'
    });

    this.addOrganizationStructuredData();
  }

  private addOrganizationStructuredData(): void {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "NetNest",
      "description": "Premium E-commerce Store providing quality products and excellent customer service",
      "url": "https://yourdomain.com",
      "logo": "https://yourdomain.com/assets/images/logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "url": "https://yourdomain.com/contact"
      },
      "sameAs": [
        "https://facebook.com/netnest",
        "https://twitter.com/netnest",
        "https://instagram.com/netnest"
      ]
    };

    this.insertStructuredData(structuredData);
  }

  private insertStructuredData(data: any): void {
    if (typeof document === 'undefined') return;

    const existingScript = document.getElementById('organization-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'organization-structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  loadAboutPage(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.subscription = this.pagesService.getAboutPage()
      .pipe(
        tap((response) => {
          const aboutData = response.data;
          this.aboutPage.set(aboutData);

          if (aboutData) {
            this.updateAboutSEOWithContent(aboutData);
          }
        }),
        catchError(() => {
          this.hasError.set(true);
          this.toastr.error('Neizdevās ielādēt informāciju par mums');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  private updateAboutSEOWithContent(aboutData: AboutPage): void {
    const textContent = this.stripHtml(aboutData.content || '');
    const description = textContent.length > 160
      ? textContent.substring(0, 157) + '...'
      : textContent || 'Learn about NetNest\'s mission to provide premium products and excellent service.';

    this.seoService.updateSEO({
      title: `${aboutData.title || 'About Us'} - NetNest`,
      description: description,
      keywords: 'about us, NetNest, company, mission, values, quality, customer service',
      type: 'website',
      url: 'https://yourdomain.com/about',
      publishedTime: aboutData.created_at,
      modifiedTime: aboutData.updated_at
    });
  }

  private stripHtml(html: string): string {
    if (typeof document === 'undefined') return html;

    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  getSafeHtml(content: string | undefined): SafeHtml {
    if (!content) return '';
    try {
      return this.sanitizer.bypassSecurityTrustHtml(content);
    } catch (error) {
      return content || '';
    }
  }

  retryLoading(): void {
    this.loadAboutPage();
  }

  hasValidContent(): boolean {
    const content = this.aboutPage()?.content;
    if (!content) return false;

    const textContent = this.stripHtml(content);
    return textContent.trim().length > 10;
  }

  getFormattedDate(dateString?: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('lv-LV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }

  getFeatureCards() {
    return [
      {
        icon: '🎯',
        title: 'Mūsu misija',
        description: 'Nodrošināt kvalitatīvus produktus un izcilu klientu apkalpošanu'
      },
      {
        icon: '⭐',
        title: 'Kvalitāte',
        description: 'Augstākā kvalitāte visos mūsu produktos un pakalpojumos'
      },
      {
        icon: '🤝',
        title: 'Uzticamība',
        description: 'Ilgtermiņa attiecības ar mūsu klientiem un partneriem'
      },
      {
        icon: '🚀',
        title: 'Inovācijas',
        description: 'Vienmēr meklējam jaunus veidus, kā uzlabot klientu pieredzi'
      }
    ];
  }
}
