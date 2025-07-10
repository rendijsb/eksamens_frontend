import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  price?: string;
  currency?: string;
  availability?: string;
  category?: string;
  brand?: string;
  productId?: string;
  noindex?: boolean;
  canonical?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly router = inject(Router);

  private defaultSEO: Required<Omit<SEOData, 'publishedTime' | 'modifiedTime' | 'noindex' | 'canonical' | 'price' | 'currency' | 'availability' | 'category' | 'brand' | 'productId'>> = {
    title: 'NetNest - Premium E-commerce Store',
    description: 'Discover premium products at NetNest. Quality items, great prices, and excellent service.',
    keywords: 'e-commerce, online shopping, premium products, NetNest',
    image: '/assets/images/default-og-image.jpg',
    url: 'https://yourdomain.com',
    type: 'website',
    siteName: 'NetNest',
    locale: 'lv_LV',
    author: 'NetNest Team'
  };

  updateSEO(data: Partial<SEOData>) {
    const seoData: SEOData = { ...this.defaultSEO, ...data };

    this.title.setTitle(seoData.title);

    this.meta.updateTag({
      name: 'description',
      content: seoData.description
    });
    this.meta.updateTag({
      name: 'keywords',
      content: seoData.keywords || this.defaultSEO.keywords
    });
    this.meta.updateTag({
      name: 'author',
      content: seoData.author || this.defaultSEO.author
    });

    this.meta.updateTag({
      property: 'og:title',
      content: seoData.title
    });
    this.meta.updateTag({
      property: 'og:description',
      content: seoData.description
    });
    this.meta.updateTag({
      property: 'og:image',
      content: seoData.image || this.defaultSEO.image
    });
    this.meta.updateTag({
      property: 'og:url',
      content: seoData.url || this.getCurrentUrl()
    });
    this.meta.updateTag({
      property: 'og:type',
      content: seoData.type || this.defaultSEO.type
    });
    this.meta.updateTag({
      property: 'og:site_name',
      content: seoData.siteName || this.defaultSEO.siteName
    });
    this.meta.updateTag({
      property: 'og:locale',
      content: seoData.locale || this.defaultSEO.locale
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: seoData.title });
    this.meta.updateTag({ name: 'twitter:description', content: seoData.description });
    this.meta.updateTag({
      name: 'twitter:image',
      content: seoData.image || this.defaultSEO.image
    });

    this.updateCanonicalUrl(seoData.canonical || seoData.url || this.getCurrentUrl());

    if (seoData.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    }

    if (seoData.publishedTime) {
      this.meta.updateTag({
        property: 'article:published_time',
        content: seoData.publishedTime
      });
    }
    if (seoData.modifiedTime) {
      this.meta.updateTag({
        property: 'article:modified_time',
        content: seoData.modifiedTime
      });
    }
  }

  updateProductSEO(product: any) {
    const productName = product?.name || 'Product';
    const productDescription = product?.description || product?.short_description || `Buy ${productName} at NetNest.`;
    const categoryName = product?.category?.name || '';
    const primaryImage = product?.primary_image || this.defaultSEO.image;
    const price = product?.sale_price || product?.price || '0';
    const stock = product?.stock || 0;
    const productId = product?.id?.toString() || '';

    const seoData: SEOData = {
      title: `${productName} - NetNest`,
      description: productDescription,
      keywords: `${productName}, ${categoryName}, e-commerce, online shopping`,
      image: primaryImage,
      url: this.getCurrentUrl(),
      type: 'product',
      price: price.toString(),
      currency: 'EUR',
      availability: stock > 0 ? 'in stock' : 'out of stock',
      category: categoryName,
      brand: 'NetNest',
      productId: productId
    };

    this.updateSEO(seoData);
    this.updateProductStructuredData(product);
  }

  updateCategorySEO(category: any, products?: any[]) {
    const categoryName = category?.name || 'Category';
    const categoryDescription = category?.description || `Shop ${categoryName} at NetNest. Quality products at great prices.`;
    const categoryImage = category?.image || this.defaultSEO.image;

    const seoData: SEOData = {
      title: `${categoryName} - NetNest`,
      description: categoryDescription,
      keywords: `${categoryName}, category, e-commerce, online shopping`,
      image: categoryImage,
      url: this.getCurrentUrl(),
      type: 'website'
    };

    this.updateSEO(seoData);
    if (products && products.length > 0) {
      this.updateCategoryStructuredData(category, products);
    }
  }

  updateHomeSEO() {
    const seoData: SEOData = {
      title: 'NetNest - Premium E-commerce Store | Quality Products Online',
      description: 'Shop premium products at NetNest. Discover quality items across multiple categories with great prices and excellent customer service.',
      keywords: 'e-commerce, online shopping, premium products, quality items, NetNest',
      url: this.getCurrentUrl(),
      type: 'website'
    };

    this.updateSEO(seoData);
    this.updateWebsiteStructuredData();
  }

  private updateCanonicalUrl(url: string) {
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  private getCurrentUrl(): string {
    if (typeof window !== 'undefined') {
      return `https://yourdomain.com${this.router.url}`;
    }
    return 'https://yourdomain.com';
  }

  private updateProductStructuredData(product: any) {
    if (!product) return;

    const productName = product.name || 'Product';
    const productDescription = product.description || product.short_description || '';
    const primaryImage = product.primary_image || '';
    const price = product.sale_price || product.price || 0;
    const stock = product.stock || 0;
    const categoryName = product.category?.name || '';
    const averageRating = product.average_rating || null;
    const reviewCount = product.review_count || 0;

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": productName,
      "description": productDescription,
      "image": primaryImage ? [primaryImage] : [],
      "brand": {
        "@type": "Brand",
        "name": "NetNest"
      },
      "category": categoryName,
      "offers": {
        "@type": "Offer",
        "price": price.toString(),
        "priceCurrency": "EUR",
        "availability": stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": this.getCurrentUrl(),
        "seller": {
          "@type": "Organization",
          "name": "NetNest"
        }
      },
      ...(averageRating && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": averageRating,
          "reviewCount": reviewCount
        }
      })
    };

    this.insertStructuredData(structuredData, 'product-structured-data');
  }

  private updateCategoryStructuredData(category: any, products: any[]) {
    if (!category || !products) return;

    const categoryName = category.name || 'Category';
    const categoryDescription = category.description || '';

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "CollectionPage",
      "name": categoryName,
      "description": categoryDescription,
      "url": this.getCurrentUrl(),
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": products.length,
        "itemListElement": products.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product?.name || 'Product',
            "url": `/product/${product?.slug || ''}`,
            "image": product?.primary_image || ''
          }
        }))
      }
    };

    this.insertStructuredData(structuredData, 'category-structured-data');
  }

  private updateWebsiteStructuredData() {
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "WebSite",
      "name": "NetNest",
      "description": "Premium E-commerce Store",
      "url": "https://yourdomain.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://yourdomain.com/products?search={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "NetNest",
        "logo": {
          "@type": "ImageObject",
          "url": "https://yourdomain.com/assets/images/logo.png"
        }
      }
    };

    this.insertStructuredData(structuredData, 'website-structured-data');
  }

  private insertStructuredData(data: any, id: string) {
    if (typeof document === 'undefined') return;

    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  clearSEO() {
    const tagsToRemove = [
      'description', 'keywords', 'author', 'robots',
      'og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name',
      'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
      'article:published_time', 'article:modified_time'
    ];

    tagsToRemove.forEach(tag => {
      if (tag.startsWith('og:')) {
        this.meta.removeTag(`property="${tag}"`);
      } else if (tag.startsWith('twitter:')) {
        this.meta.removeTag(`name="${tag}"`);
      } else {
        this.meta.removeTag(`name="${tag}"`);
      }
    });
  }
}
