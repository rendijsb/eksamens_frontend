import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {AboutPage, PagesService} from "../service/page.service";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  animations: [
    trigger('fadeInUp', [
      state('in', style({opacity: 1, transform: 'translateY(0)'})),
      transition('void => *', [
        style({opacity: 0, transform: 'translateY(30px)'}),
        animate(800)
      ])
    ]),
    trigger('slideIn', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(-100px)'}),
        animate('1000ms ease-out')
      ])
    ])
  ]
})
export class AboutComponent implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly toastr = inject(ToastrService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly aboutPage = signal<AboutPage | null>(null);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadAboutPage();
  }

  loadAboutPage(): void {
    this.isLoading.set(true);

    this.pagesService.getAboutPage()
      .pipe(
        tap((response) => {
          this.aboutPage.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Neizdevās ielādēt informāciju par mums');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  getSafeHtml(content: string|undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(<string>content) || '';
  }
}
