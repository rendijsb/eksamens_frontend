import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {Product} from "../../admin/products-page/models/products.models";
import {Category} from "../../admin/categories-page/models/categories.models";
import {PublicService} from "../service/public.service";
import {ToastrService} from "ngx-toastr";
import {catchError, EMPTY, finalize, tap} from "rxjs";
import {Banner} from "../../admin/banners-page/models/banner.models";
import {CartService} from "../service/cart.service";
import {AuthService} from "../../auth/services/auth.service";
import {StarRatingComponent} from "../../reviews/star-rating/star-rating.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StarRatingComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly featuredProducts: WritableSignal<Product[] | null> = signal<Product[] | null>(null);
  protected readonly categories: WritableSignal<Category[] | null> = signal<Category[] | null>(null);

  bannerSlides: WritableSignal<Banner[]> = signal([]);

  currentSlideIndex = signal(0);
  emailInput = signal('');

  protected readonly processingProductIds = signal<number[]>([]);

  ngOnInit(): void {
    this.fetchAllProducts();
    this.fetchAllCategories();
    this.fetchAllBanners();
  }

  fetchAllCategories(): void {
    this.publicService.getAllCategories()
      .pipe(
        tap((response) => {
          this.categories.set(response.data);
        }),
        catchError(() => {
          this.toastr.error('Neizdevās atrast kategorijas')
          return EMPTY;
        })
      )
      .subscribe();
  }

  fetchAllProducts(): void {
    this.publicService.getProducts()
      .pipe(
        tap((response) => {
          this.featuredProducts.set(response.data)
        }),
        catchError(() => {
          this.toastr.error('Neizdevās atrast produktus')
          return EMPTY;
        })
      )
      .subscribe();
  }

  fetchAllBanners(): void {
    this.publicService.getBanners()
      .pipe(
        tap((response) => {
          this.bannerSlides.set(response.data)
        }),
        catchError(() => {
          this.toastr.error('Neizdevās atrast bannerus')
          return EMPTY;
        })
      )
      .subscribe();
  }

  nextSlide(): void {
    this.currentSlideIndex.update(current =>
      current < this.bannerSlides().length - 1 ? current + 1 : 0
    );
  }

  prevSlide(): void {
    this.currentSlideIndex.update(current =>
      current > 0 ? current - 1 : this.bannerSlides().length - 1
    );
  }

  setCurrentSlide(index: number): void {
    this.currentSlideIndex.set(index);
  }

  isProductProcessing(productId: number): boolean {
    return this.processingProductIds().includes(productId);
  }

  private setProcessingProduct(productId: number, isProcessing: boolean): void {
    this.processingProductIds.update(ids => {
      if (isProcessing) {
        if (!ids.includes(productId)) {
          return [...ids, productId];
        }
        return ids;
      } else {
        return ids.filter(id => id !== productId);
      }
    });
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.toastr.info('Lūdzu, ielogojietes, lai pievienotu preces grozam');
      this.router.navigate(['/login']);
      return;
    }

    if (product.stock <= 0) {
      this.toastr.error('Produkts nav pieejams noliktavā');
      return;
    }

    if (this.isProductProcessing(product.id)) {
      return;
    }

    this.setProcessingProduct(product.id, true);

    this.cartService.addToCart(product.id)
      .pipe(
        tap((response) => {
          if (response) {
            this.toastr.success(product.name + ' veiksmīgi pievienots grozam');
          } else {
            this.toastr.error('Nepietiekams daudzums noliktavā');
          }
        }),
        catchError((error) => {
          if (error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Neizdevās pievienot produktu grozam');
          }
          return EMPTY;
        }),
        finalize(() => {
          this.setProcessingProduct(product.id, false);
        })
      )
      .subscribe();
  }

  getFormattedRating(rating: any): string {
    if (!rating) return '0.0';
    return Number(rating).toFixed(1);
  }
}
