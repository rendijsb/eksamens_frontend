import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import {AboutPage, PagesService} from "../../main/service/page.service";

@Component({
  selector: 'app-about-admin',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './about-admin.component.html',
  styleUrls: ['../styles/admin-page-styles.scss']
})
export class AboutAdminComponent implements OnInit {
  private readonly pagesService = inject(PagesService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);

  protected readonly aboutPages = signal<AboutPage[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isProcessing = signal(false);

  ngOnInit(): void {
    this.loadAllAboutPages();
  }

  loadAllAboutPages(): void {
    this.isLoading.set(true);

    this.pagesService.getAllAboutPages()
      .pipe(
        tap((response) => {
          this.aboutPages.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Neizdevās ielādēt "Par mums" lapas');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  createNewAboutPage(): void {
    this.router.navigate(['/admin/pages/about/create']);
  }

  editAboutPage(id: number): void {
    this.router.navigate([`/admin/pages/about/${id}/edit`]);
  }

  deleteAboutPage(id: number): void {
    if (!confirm('Vai tiešām vēlaties dzēst šo lapu?')) {
      return;
    }

    this.isProcessing.set(true);

    this.pagesService.deleteAboutPage(id)
      .pipe(
        tap((response) => {
          this.toastr.success(response.message || 'Lapa veiksmīgi dzēsta');
          this.loadAllAboutPages();
        }),
        catchError(() => {
          this.toastr.error('Neizdevās dzēst lapu');
          return EMPTY;
        }),
        finalize(() => {
          this.isProcessing.set(false);
        })
      )
      .subscribe();
  }
}
