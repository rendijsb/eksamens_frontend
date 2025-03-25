import { Component, OnInit, inject, signal, WritableSignal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { PublicService } from '../service/public.service';
import { Product } from '../../admin/products-page/models/products.models';
import { Image } from '../../admin/shared/services/image.service';
import { ButtonLoaderDirective } from '../../../shared/directives/button-loader/button-loader.directive';
import {CartService} from "../service/cart.service";

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonLoaderDirective
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);

  product: WritableSignal<Product | null> = signal(null);
  productImages: WritableSignal<Image[]> = signal([]);
  relatedProducts: WritableSignal<Product[]> = signal([]);
  selectedImage: WritableSignal<string> = signal('');
  isLoading: WritableSignal<boolean> = signal(true);
  quantity: WritableSignal<number> = signal(1);
  isAddingToCart: WritableSignal<boolean> = signal(false);
  activeTab: WritableSignal<string> = signal('specifications');
  isInWishlist: WritableSignal<boolean> = signal(false);

  activePrice = computed(() => {
    if (!this.product()) return null;
    return this.product()?.is_sale_active ? this.product()!.sale_price : this.product()!.price;
  });

  discountPercentage = computed(() => {
    if (!this.product() || !this.product()!.is_sale_active) return 0;
    const originalPrice = parseFloat(this.product()!.price as string);
    const salePrice = parseFloat(this.product()!.sale_price as string);
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  });

  isInStock = computed(() => {
    return this.product() && this.product()!.stock > 0;
  });

  stockStatus = computed(() => {
    if (!this.product()) return '';

    const stock = this.product()!.stock;
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
  });

  maxQuantity = computed(() => {
    return this.product()?.stock || 0;
  });

  optionsForm: FormGroup = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    const productSlug = this.route.snapshot.paramMap.get('slug');

    if (!productSlug) {
      this.router.navigate(['/products']);
      return;
    }

    this.loadProduct(productSlug);

    effect(() => {
      this.optionsForm.get('quantity')?.setValue(this.quantity(), { emitEvent: false });
      if (this.product()) {
        this.checkWishlistStatus();
      }
    });

    this.optionsForm.get('quantity')?.valueChanges.subscribe(value => {
      if (value && !isNaN(value)) {
        this.quantity.set(parseInt(value));
      }
    });
  }

  loadProduct(slug: string): void {
    this.isLoading.set(true);

    this.publicService.getProductBySlug(slug)
      .pipe(
        tap(response => {
          this.product.set(response.data);

          if (response.data.primary_image) {
            this.selectedImage.set(response.data.primary_image);
          }

          this.loadProductImages(response.data.id);
        }),
        catchError(error => {
          this.toastr.error('Product not found');
          this.router.navigate(['/products']);
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  loadProductImages(productId: number): void {
    this.publicService.getProductImages(productId)
      .pipe(
        tap(response => {
          this.productImages.set(response.data);

          if (!this.selectedImage() && response.data.length > 0) {
            this.selectedImage.set(response.data[0].image_url);
          }
        }),
        catchError(() => {
          return EMPTY;
        }),
        finalize(() => {
          if (this.product()) {
            this.loadRelatedProducts(this.product()!.category_id, this.product()!.id);
          }
        })
      )
      .subscribe();
  }

  loadRelatedProducts(categoryId: number, productId: number): void {
    this.publicService.getRelatedProducts(categoryId, productId)
      .pipe(
        tap(response => {
          this.relatedProducts.set(response.data);
        }),
        catchError(() => {
          return EMPTY;
        })
      )
      .subscribe();
  }

  selectImage(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
      this.optionsForm.get('quantity')?.setValue(this.quantity(), { emitEvent: false });
    }
  }

  increaseQuantity(): void {
    if (this.quantity() < this.maxQuantity()) {
      this.quantity.update(q => q + 1);
      this.optionsForm.get('quantity')?.setValue(this.quantity(), { emitEvent: false });
    }
  }

  addToCart(): void {
    if (!this.product() || !this.isInStock()) {
      return;
    }

    this.isAddingToCart.set(true);

    this.cartService.addToCart(this.product()!.id, this.quantity())
      .pipe(
        tap(() => {
          this.toastr.success(`Pievienots ${this.quantity()} ${this.product()!.name} grozam`);
        }),
        catchError(() => {
          this.toastr.error('Neizdevās pievienot produktu grozam');
          return EMPTY;
        }),
        finalize(() => {
          this.isAddingToCart.set(false);
        })
      )
      .subscribe();
  }

  addToWishlist(): void {
    if (!this.product()) {
      return;
    }

    this.isInWishlist.update(state => !state);

    if (this.isInWishlist()) {
      this.toastr.success(`${this.product()!.name} pievienots jūsu vēlmju sarakstam`);
    } else {
      this.toastr.info(`${this.product()!.name} noņemts no jūsu vēlmju saraksta`);
    }
  }

  formatPrice(price: number | string | null): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice ? numPrice.toFixed(2) : '';
  }

  getStockLabel(): string {
    if (!this.product()) return '';

    const stock = this.product()!.stock;
    if (stock <= 0) return 'Nav Noliktavā';
    if (stock <= 5) return `Maz Noliktavā (atlicis ${stock})`;
    return 'Noliktavā';
  }

  setActiveTab(tabName: string): void {
    this.activeTab.set(tabName);
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab() === tabName;
  }

  checkWishlistStatus(): void {
    this.isInWishlist.set(false);
  }
}
