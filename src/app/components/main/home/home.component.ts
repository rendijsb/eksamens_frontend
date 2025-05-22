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
import {NewsletterService} from "../service/newsletter.service";
import {ButtonLoaderDirective} from "../../../shared/directives/button-loader/button-loader.directive";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {LoaderComponent} from "../../../shared/components/loader/loader.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StarRatingComponent,
    ButtonLoaderDirective,
    LoaderComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
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
export class HomeComponent implements OnInit {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly newsletterService = inject(NewsletterService);

  protected readonly featuredProducts: WritableSignal<Product[] | null> = signal<Product[] | null>(null);
  protected readonly categories: WritableSignal<Category[] | null> = signal<Category[] | null>(null);
  protected readonly isNewsletterLoading: WritableSignal<boolean> = signal<boolean>(false);

  bannerSlides: WritableSignal<Banner[]> = signal([]);

  currentSlideIndex = signal(0);
  emailInput = signal('');

  protected readonly processingProductIds = signal<number[]>([]);

  protected readonly isLoadingCategoriesAndProducts = signal<boolean>(true);
  protected readonly isLoadingBanners = signal<boolean>(true);

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
        }),
        finalize(() => {
          this.isLoadingCategoriesAndProducts.set(false);
        })
      )
      .subscribe();
  }

  fetchAllProducts(): void {
    this.isLoadingCategoriesAndProducts.set(true);

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
    this.isLoadingBanners.set(true);

    this.publicService.getBanners()
      .pipe(
        tap((response) => {
          this.bannerSlides.set(response.data)
        }),
        catchError(() => {
          this.toastr.error('Neizdevās atrast bannerus')
          return EMPTY;
        }),
        finalize(() => {
          this.isLoadingBanners.set(false);
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

  subscribeToNewsletter(): void {
    const email = this.emailInput();

    if (!email || !this.isValidEmail(email)) {
      this.toastr.error('Lūdzu, ievadiet derīgu e-pasta adresi');
      return;
    }

    this.isNewsletterLoading.set(true);

    this.newsletterService.subscribe(email)
      .pipe(
        tap((response) => {
          this.toastr.success(response.message);
          this.emailInput.set('');
        }),
        catchError((error) => {
          const errorMessage = 'Neizdevās pierakstīties jaunumiem';
          this.toastr.error(errorMessage);
          return EMPTY;
        }),
        finalize(() => {
          this.isNewsletterLoading.set(false);
        })
      )
      .subscribe();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onEmailInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.emailInput.set(input.value);
  }
}
