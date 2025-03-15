import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {Product} from "../../admin/products-page/models/products.models";
import {Category} from "../../admin/categories-page/models/categories.models";
import {PublicService} from "../service/public.service";
import {ToastrService} from "ngx-toastr";
import {catchError, EMPTY, tap} from "rxjs";

interface BannerType {
  id: number,
  title: string,
  subtitle: string,
  buttonText: string,
  buttonLink: string,
  image: string
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly publicService = inject(PublicService);
  private readonly toastr = inject(ToastrService);

  protected readonly featuredProducts: WritableSignal<Product[] | null> = signal<Product[] | null>(null);
  protected readonly categories: WritableSignal<Category[] | null> = signal<Category[] | null>(null);

  bannerSlides: WritableSignal<BannerType[]> = signal([]);

  currentSlideIndex = signal(0);
  emailInput = signal('');

  ngOnInit(): void {
    this.fetchAllProducts();
    this.fetchAllCategories();
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
}
