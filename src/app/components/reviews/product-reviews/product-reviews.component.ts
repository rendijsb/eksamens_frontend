import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { Review } from '../models/review.models';
import { ReviewService } from '../services/review.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [
    CommonModule,
    StarRatingComponent
  ],
  templateUrl: './product-reviews.component.html',
  styleUrl: './product-reviews.component.scss'
})
export class ProductReviewsComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly toastr = inject(ToastrService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  productId = input.required<number>();
  reviews = signal<Review[]>([]);
  isLoading = signal(true);
  showReviewForm = signal(false);
  newRating = signal(0);
  newReviewText = signal('');
  isSubmitting = signal(false);
  averageRating = signal(0);
  authError = signal(false);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadReviews();
    } else {
      this.isLoading.set(false);
      this.authError.set(true);
    }
  }

  loadReviews(): void {
    this.isLoading.set(true);
    this.authError.set(false);

    this.reviewService.getProductReviews(this.productId())
      .pipe(
        tap(response => {
          this.reviews.set(response.data);
          this.calculateAverageRating();
        }),
        catchError(error => {
          if (error.status === 401) {
            this.authError.set(true);
          } else {
            this.toastr.error('Neizdevās ielādēt atsauksmes');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  calculateAverageRating(): void {
    if (this.reviews().length === 0) {
      this.averageRating.set(0);
      return;
    }

    const total = this.reviews().reduce((sum, review) => sum + review.rating, 0);
    this.averageRating.set(parseFloat((total / this.reviews().length).toFixed(1)));
  }

  toggleReviewForm(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastr.info('Lūdzu ielogojieties, lai rakstītu atsauksmi');
      this.router.navigate(['/login']);
      return;
    }

    const userHasReview = this.reviews().some(
      review => review.user_id === this.authService.user()?.id
    );

    if (userHasReview) {
      this.toastr.info('Jūs jau esat novērtējis šo produktu');
      return;
    }

    this.showReviewForm.update(current => !current);
  }

  onRatingChange(rating: number): void {
    this.newRating.set(rating);
  }

  onReviewTextChange(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.newReviewText.set(input.value);
  }

  submitReview(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastr.error('Jums jābūt ielogotam, lai iesniegtu atsauksmi');
      this.router.navigate(['/login']);
      return;
    }

    if (this.newRating() === 0) {
      this.toastr.error('Lūdzu, izvēlieties vērtējumu');
      return;
    }

    this.isSubmitting.set(true);

    this.reviewService.createReview({
      product_id: this.productId(),
      rating: this.newRating(),
      review_text: this.newReviewText() || undefined
    })
      .pipe(
        tap(response => {
          this.toastr.success('Atsauksme veiksmīgi iesniegta');
          this.reviews.update(reviews => [response.data, ...reviews]);
          this.calculateAverageRating();
          this.resetForm();
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Neizdevās iesniegt atsauksmi');
          return EMPTY;
        }),
        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe();
  }

  resetForm(): void {
    this.newRating.set(0);
    this.newReviewText.set('');
    this.showReviewForm.set(false);
  }

  canDeleteReview(review: Review): boolean {
    const currentUser = this.authService.user();
    if (!currentUser) return false;

    if (this.authService.isAdmin() || this.authService.isModerator()) {
      return true;
    }

    return currentUser.id === review.user_id;
  }

  deleteReview(review: Review, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm('Vai tiešām vēlaties dzēst šo atsauksmi?')) {
      return;
    }

    this.reviewService.deleteReview(review.id)
      .pipe(
        tap(() => {
          this.toastr.success('Atsauksme veiksmīgi dzēsta');
          this.reviews.update(reviews => reviews.filter(r => r.id !== review.id));
          this.calculateAverageRating();
        }),
        catchError(error => {
          this.toastr.error('Neizdevās dzēst atsauksmi');
          return EMPTY;
        })
      )
      .subscribe();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('lv-LV', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }
}
