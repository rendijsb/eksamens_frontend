import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/review.models';
import { ApiUrlService } from "../../../shared/services/api.service";

export interface ReviewsResponse {
  data: Review[];
}

export interface ReviewResponse {
  data: Review;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getProductReviews(productId: number): Observable<ReviewsResponse> {
    return this.http.get<ReviewsResponse>(
      this.apiUrlService.getUrl(`api/profile/products/${productId}/reviews`)
    );
  }

  getUserReviews(): Observable<ReviewsResponse> {
    return this.http.get<ReviewsResponse>(
      this.apiUrlService.getUrl('api/reviews/user')
    );
  }

  createReview(data: { product_id: number; rating: number; review_text?: string }): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(
      this.apiUrlService.getUrl('api/reviews/create'),
      data
    );
  }

  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl(`api/reviews/${reviewId}`)
    );
  }

  getAllReviews(): Observable<ReviewsResponse> {
    return this.http.get<ReviewsResponse>(
      this.apiUrlService.getUrl('api/admin/reviews')
    );
  }

  getPendingReviews(): Observable<ReviewsResponse> {
    return this.http.get<ReviewsResponse>(
      this.apiUrlService.getUrl('api/admin/reviews/pending')
    );
  }

  updateReviewStatus(reviewId: number, isApproved: boolean): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(
      this.apiUrlService.getUrl(`api/admin/reviews/${reviewId}/status`),
      { is_approved: isApproved }
    );
  }

  deleteReviewAsAdmin(reviewId: number): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl(`api/admin/reviews/${reviewId}`)
    );
  }
}
