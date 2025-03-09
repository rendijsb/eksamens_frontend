import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiUrlService } from "../../../../shared/services/api.service";

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
}

interface ProductImagesResponse {
  data: ProductImage[];
}

interface UploadImagesResponse {
  message: string;
  data: ProductImage[];
}

interface SetPrimaryResponse {
  message: string;
  data: ProductImage;
}

interface DeleteImageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductImageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getProductImages(productId: number): Observable<ProductImagesResponse> {
    return this.http.get<ProductImagesResponse>(
      this.apiUrlService.getUrl(`api/product-images/${productId}`)
    );
  }

  uploadImages(productId: number, images: File[]): Observable<UploadImagesResponse> {
    const formData = new FormData();

    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    return this.http.post<UploadImagesResponse>(
      this.apiUrlService.getUrl(`api/product-images/upload/${productId}`),
      formData
    );
  }

  setPrimaryImage(imageId: number): Observable<SetPrimaryResponse> {
    return this.http.patch<SetPrimaryResponse>(
      this.apiUrlService.getUrl(`api/product-images/set-primary/${imageId}`),
      {}
    );
  }

  deleteImage(imageId: number): Observable<DeleteImageResponse> {
    return this.http.delete<DeleteImageResponse>(
      this.apiUrlService.getUrl(`api/product-images/delete/${imageId}`)
    );
  }
}
