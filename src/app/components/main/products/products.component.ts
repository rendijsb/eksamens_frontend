import { Component, OnDestroy, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PublicService } from '../service/public.service';
import { Product } from '../../admin/products-page/models/products.models';
import { Category } from '../../admin/categories-page/models/categories.models';
import { ToastrService } from 'ngx-toastr';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, Subscription, take, tap } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private subscriptions: Subscription[] = [];
  private categoriesLoaded = false;
  private isInitialLoad = true;

  products: WritableSignal<Product[]> = signal([]);
  categories: WritableSignal<Category[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(false);
  viewMode: WritableSignal<'grid' | 'list'> = signal('grid');
  totalItems: WritableSignal<number> = signal(0);
  currentPage: WritableSignal<number> = signal(1);
  itemsPerPage: WritableSignal<number> = signal(12);
  totalPages: WritableSignal<number> = signal(1);

  selectedCategory: WritableSignal<number | null> = signal(null);
  minPrice: WritableSignal<number> = signal(0);
  maxPrice: WritableSignal<number> = signal(1000);
  sortBy: WritableSignal<string> = signal('created_at');
  sortDirection: WritableSignal<string> = signal('desc');

  filterForm: FormGroup = this.fb.group({
    category: [null],
    priceRange: this.fb.group({
      min: [0],
      max: [1000]
    }),
    search: [''],
    sort: ['created_at-desc']
  });

  priceRanges = [
    { label: 'All Prices', min: 0, max: null },
    { label: 'Under €50', min: 0, max: 50 },
    { label: '€50 - €100', min: 50, max: 100 },
    { label: '€100 - €200', min: 100, max: 200 },
    { label: 'Over €200', min: 200, max: null }
  ];

  sortOptions = [
    { value: 'created_at-desc', label: 'Pēc jaunākajiem' },
    { value: 'created_at-asc', label: 'Pēc vecākajiem' },
    { value: 'price-asc', label: 'Cena: sākot ar zemāko' },
    { value: 'price-desc', label: 'Cena: sākot ar augstāko' },
    { value: 'name-asc', label: 'Nosaukums: A uz Z' },
    { value: 'name-desc', label: 'Nosaukums: Z uz A' },
    { value: 'sold-desc', label: 'Populārākie' }
  ];

  ngOnInit(): void {
    this.loadCategories();

    this.isLoading.set(true);

    const routeSubscription = this.route.queryParams
      .pipe(take(1))
      .subscribe(params => {
        this.processQueryParams(params);

        this.setupFormSubscriptions();

        this.loadProducts();

        this.subscribeToQueryParamChanges();
      });

    this.subscriptions.push(routeSubscription);
  }

  private processQueryParams(params: any): void {
    if (params['category']) {
      const categoryId = Number(params['category']);
      this.selectedCategory.set(categoryId);
      this.filterForm.get('category')?.setValue(categoryId, { emitEvent: false });
    }

    if (params['page']) {
      this.currentPage.set(Number(params['page']));
    }

    if (params['sort']) {
      const sortParam = params['sort'];
      const [field, direction] = sortParam.split('-');
      this.sortBy.set(field);
      this.sortDirection.set(direction || 'desc');

      const sortValue = `${field}-${direction || 'desc'}`;
      this.sortControl.setValue(sortValue, { emitEvent: false });
    }

    if (params['minPrice']) {
      const minPrice = Number(params['minPrice']);
      this.minPrice.set(minPrice);
      this.priceRangeGroup.get('min')?.setValue(minPrice, { emitEvent: false });
    }

    if (params['maxPrice']) {
      const maxPrice = Number(params['maxPrice']);
      this.maxPrice.set(maxPrice);
      this.priceRangeGroup.get('max')?.setValue(maxPrice, { emitEvent: false });
    }

    if (params['view']) {
      this.viewMode.set(params['view'] as 'grid' | 'list');
    }

    if (params['search']) {
      this.filterForm.get('search')?.setValue(params['search'], { emitEvent: false });
    }
  }

  private setupFormSubscriptions(): void {
    const categorySubscription = this.filterForm.get('category')?.valueChanges.subscribe(value => {
      this.selectedCategory.set(value);
      this.currentPage.set(1);
      this.updateQueryParams();
    });
    if (categorySubscription) this.subscriptions.push(categorySubscription);

    const searchSubscription = this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.currentPage.set(1);
        this.updateQueryParams();
      });
    if (searchSubscription) this.subscriptions.push(searchSubscription);

    const priceSubscription = this.priceRangeGroup.valueChanges.subscribe(value => {
      this.minPrice.set(value.min);
      this.maxPrice.set(value.max);
      this.currentPage.set(1);
      this.updateQueryParams();
    });
    if (priceSubscription) this.subscriptions.push(priceSubscription);

    const sortSubscription = this.sortControl.valueChanges.subscribe(value => {
      if (value) {
        const [field, direction] = value.split('-');
        this.sortBy.set(field);
        this.sortDirection.set(direction || 'desc');
        this.updateQueryParams();
      }
    });
    if (sortSubscription) this.subscriptions.push(sortSubscription);
  }

  private subscribeToQueryParamChanges(): void {
    const ongoingRouteSubscription = this.route.queryParams
      .subscribe(params => {
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          return;
        }

        if (!this.router.navigated) {
          this.processQueryParams(params);
          this.loadProducts();
        }
      });

    this.subscriptions.push(ongoingRouteSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get priceRangeGroup(): FormGroup {
    return this.filterForm.get('priceRange') as FormGroup;
  }

  get sortControl(): FormControl {
    return this.filterForm.get('sort') as FormControl;
  }

  loadCategories(): void {
    if (this.categoriesLoaded) {
      return;
    }

    this.categoriesLoaded = true;

    const subscription = this.publicService.getAllCategories()
      .pipe(
        tap(response => {
          if (response && response.data) {
            this.categories.set(response.data);
          }
        }),
        catchError(error => {
          this.categoriesLoaded = false;
          this.toastr.error('Neizdevās ielādēt kategorijas');
          return EMPTY;
        })
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  loadProducts(): void {
    this.isLoading.set(true);

    const params = {
      page: this.currentPage(),
      per_page: this.itemsPerPage(),
      category_id: this.selectedCategory(),
      sort_by: this.sortBy(),
      sort_dir: this.sortDirection(),
      min_price: this.minPrice() || 0,
      max_price: this.maxPrice() || undefined,
      search: this.filterForm.get('search')?.value
    };

    const subscription = this.publicService.getProductsWithFilters(params)
      .pipe(
        tap(response => {
          if (response && response.data) {
            this.products.set(response.data);

            if (response.meta) {
              this.totalItems.set(response.meta.total || 0);
              this.totalPages.set(response.meta.last_page || 1);
            }
          }
        }),
        catchError(error => {
          this.toastr.error('Neizdevās ielādēt produktus');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  updateQueryParams(): void {
    const queryParams: any = {
      page: this.currentPage(),
      sort: `${this.sortBy()}-${this.sortDirection()}`,
      view: this.viewMode()
    };

    if (this.selectedCategory()) {
      queryParams.category = this.selectedCategory();
    }

    queryParams.minPrice = this.minPrice() ? this.minPrice() : 0;

    if (this.maxPrice() && this.maxPrice() < 1000) {
      queryParams.maxPrice = this.maxPrice();
    }

    if (this.filterForm.get('search')?.value) {
      queryParams.search = this.filterForm.get('search')?.value;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });

    this.loadProducts();
  }

  toggleView(view: 'grid' | 'list'): void {
    this.viewMode.set(view);
    this.updateQueryParams();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updateQueryParams();
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sortControl.setValue(value);
  }

  selectPriceRange(min: number, max: number | null): void {
    this.priceRangeGroup.setValue({ min, max: max || 1000 });
  }

  clearFilters(): void {
    this.filterForm.reset({
      category: null,
      priceRange: { min: 0, max: 1000 },
      search: '',
      sort: 'created_at-desc'
    });

    this.selectedCategory.set(null);
    this.minPrice.set(0);
    this.maxPrice.set(1000);
    this.sortBy.set('created_at');
    this.sortDirection.set('desc');
    this.currentPage.set(1);

    this.updateQueryParams();
  }

  getFormattedPrice(price: number | string): string {
    return Number(price).toFixed(2);
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    //TODO: pievienot cart funkcionalitati
    this.toastr.success(`${product.name} pievienots grozam`);
  }
}
