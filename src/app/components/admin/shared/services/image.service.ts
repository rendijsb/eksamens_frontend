import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiUrlService } from "../../../../shared/services/api.service";
import {ImageTypeEnum} from "../models/image.models";

export interface Image {
  id: number;
  related_id: number;
  type: string;
  image_url: string;
  is_primary: boolean;
}

interface ImagesResponse {
  data: Image[];
}

interface UploadImagesResponse {
  message: string;
  data: Image[];
}

interface SetPrimaryResponse {
  message: string;
  data: Image;
}

interface DeleteImageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getProductImages(relatedId: number): Observable<ImagesResponse> {
    const params = new HttpParams()
      .set('type', ImageTypeEnum.PRODUCT);

    return this.http.get<ImagesResponse>(
      this.apiUrlService.getUrl(`api/images/${relatedId}`), { params }
    );
  }

  uploadProductImages(relatedId: number, images: File[]): Observable<UploadImagesResponse> {
    const formData = new FormData();

    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
      formData.append('type', ImageTypeEnum.PRODUCT)
    });

    return this.http.post<UploadImagesResponse>(
      this.apiUrlService.getUrl(`api/images/upload/${relatedId}`),
      formData
    );
  }

  setPrimaryImage(imageId: number): Observable<SetPrimaryResponse> {
    return this.http.patch<SetPrimaryResponse>(
      this.apiUrlService.getUrl(`api/images/set-primary/${imageId}`),
      {}
    );
  }

  deleteImage(imageId: number): Observable<DeleteImageResponse> {
    return this.http.delete<DeleteImageResponse>(
      this.apiUrlService.getUrl(`api/images/delete/${imageId}`)
    );
  }
}
