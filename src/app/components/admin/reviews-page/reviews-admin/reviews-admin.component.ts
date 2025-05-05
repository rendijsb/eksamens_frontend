import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Review } from '../../../reviews/models/review.models';
import { ReviewService } from '../../../reviews/services/review.service';
import { StarRatingComponent } from '../../../reviews/star-rating/star-rating.component';
import { ButtonLoaderDirective } from '../../../../shared/directives/button-loader/button-loader.directive';

@Component({
  selector: 'app-reviews-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    StarRatingComponent,
    ButtonLoaderDirective
  ],
  templateUrl: './reviews-admin.component.html',
  styleUrl: './reviews-admin.component.scss'
})
export class ReviewsAdminComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);

  reviews = signal<Review[]>([]);
  pendingReviews = signal<Review[]>([]);
  isLoading = signal(true);
  isPendingLoading = signal(true);
  activeTab = signal<'all' | 'pending'>('all');
  processingReviewId = signal<number | null>(null);

  filterForm: FormGroup = this.fb.group({
    searchTerm: [''],
    filterStatus: ['all']
  });

  ngOnInit(): void {
    this.loadAllReviews();
    this.loadPendingReviews();
  }

  loadAllReviews(): void {
    this.isLoading.set(true);

    this.reviewService.getAllReviews()
      .pipe(
        tap(response => {
          this.reviews.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt atsauksmes');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  loadPendingReviews(): void {
    this.isPendingLoading.set(true);

    this.reviewService.getPendingReviews()
      .pipe(
        tap(response => {
          this.pendingReviews.set(response.data);
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt gaidošās atsauksmes');
          return EMPTY;
        }),
        finalize(() => {
          this.isPendingLoading.set(false);
        })
      )
      .subscribe();
  }

  setActiveTab(tab: 'all' | 'pending'): void {
    this.activeTab.set(tab);
  }

  approveReview(review: Review): void {
    if (this.processingReviewId() !== null) return;

    this.processingReviewId.set(review.id);

    this.reviewService.updateReviewStatus(review.id, true)
      .pipe(
        tap(response => {
          this.toastr.success('Atsauksme veiksmīgi apstiprināta');

          this.pendingReviews.update(reviews =>
            reviews.filter(r => r.id !== review.id)
          );

          this.reviews.update(reviews => {
            const index = reviews.findIndex(r => r.id === review.id);
            if (index > -1) {
              const updatedReviews = [...reviews];
              updatedReviews[index] = response.data;
              return updatedReviews;
            } else {
              return [response.data, ...reviews];
            }
          });
        }),
        catchError(error => {
          this.toastr.error('Neizdevās apstiprināt atsauksmi');
          return EMPTY;
        }),
        finalize(() => {
          this.processingReviewId.set(null);
        })
      )
      .subscribe();
  }

  rejectReview(review: Review): void {
    if (this.processingReviewId() !== null) return;

    if (!confirm('Vai tiešām vēlaties dzēst šo atsauksmi?')) {
      return;
    }

    this.processingReviewId.set(review.id);

    this.reviewService.deleteReviewAsAdmin(review.id)
      .pipe(
        tap(() => {
          this.toastr.success('Atsauksme veiksmīgi dzēsta');

          this.pendingReviews.update(reviews =>
            reviews.filter(r => r.id !== review.id)
          );

          this.reviews.update(reviews =>
            reviews.filter(r => r.id !== review.id)
          );
        }),
        catchError(error => {
          this.toastr.error('Neizdevās dzēst atsauksmi');
          return EMPTY;
        }),
        finalize(() => {
          this.processingReviewId.set(null);
        })
      )
      .subscribe();
  }

  getDisplayedReviews(): Review[] {
    const currentTab = this.activeTab();
    const reviews = currentTab === 'all' ? this.reviews() : this.pendingReviews();

    const searchTerm = this.filterForm.get('searchTerm')?.value?.toLowerCase();
    const statusFilter = this.filterForm.get('filterStatus')?.value;

    return reviews.filter(review => {
      if (searchTerm && !this.reviewMatchesSearch(review, searchTerm)) {
        return false;
      }

      if (statusFilter === 'approved' && !review.is_approved) {
        return false;
      } else if (statusFilter === 'pending' && review.is_approved) {
        return false;
      }

      return true;
    });
  }

  reviewMatchesSearch(review: Review, searchTerm: string): boolean {
    return (
      review.user.name.toLowerCase().includes(searchTerm) ||
      (review.review_text?.toLowerCase().includes(searchTerm) || false) ||
      (review.product?.name.toLowerCase().includes(searchTerm) || false)
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
