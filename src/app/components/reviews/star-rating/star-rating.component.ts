import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss'
})
export class StarRatingComponent {
  rating = input<number>(0);
  maxRating = input<number>(5);
  size = input<'small' | 'medium' | 'large'>('medium');
  color = input<string>('#FFD700');
  interactive = input<boolean>(false);
  readonly = input<boolean>(true);

  hoverRating = signal<number>(0);
  ratingChange = output<number>();

  get isSmall(): boolean {
    return this.size() === 'small';
  }

  get isLarge(): boolean {
    return this.size() === 'large';
  }

  get stars(): number[] {
    return Array(this.maxRating()).fill(0).map((_, i) => i + 1);
  }

  setRating(value: number): void {
    if (this.readonly() || !this.interactive()) return;
    this.ratingChange.emit(value);
  }

  onStarHover(value: number): void {
    if (this.readonly() || !this.interactive()) return;
    this.hoverRating.set(value);
  }

  onStarLeave(): void {
    this.hoverRating.set(0);
  }

  getStarClass(star: number): string {
    const ratingValue = this.hoverRating() || this.rating();

    if (star <= ratingValue) {
      return 'fas fa-star filled';
    } else if (star - 0.5 <= ratingValue) {
      return 'fas fa-star-half-alt filled';
    } else {
      return 'far fa-star';
    }
  }
}
