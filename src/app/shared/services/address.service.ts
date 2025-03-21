import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ApiUrlService} from "./api.service";
import {AddressCreateRequest, AddressesResponse, AddressResponse, AddressUpdateRequest} from "../models/address.models";

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlService = inject(ApiUrlService);

  getUserAddresses(): Observable<AddressesResponse> {
    return this.http.get<AddressesResponse>(
      this.apiUrlService.getUrl('api/profile/addresses')
    );
  }

  createAddress(data: AddressCreateRequest): Observable<AddressResponse> {
    return this.http.post<AddressResponse>(
      this.apiUrlService.getUrl('api/profile/addresses/create'),
      data
    );
  }

  getAddressById(addressId: number): Observable<AddressResponse> {
    return this.http.get<AddressResponse>(
      this.apiUrlService.getUrl(`api/profile/addresses/${addressId}`)
    );
  }

  updateAddress(addressId: number, data: AddressUpdateRequest): Observable<AddressResponse> {
    return this.http.put<AddressResponse>(
      this.apiUrlService.getUrl(`api/profile/addresses/${addressId}`),
      data
    );
  }

  deleteAddress(addressId: number): Observable<any> {
    return this.http.delete(
      this.apiUrlService.getUrl(`api/profile/addresses/${addressId}`)
    );
  }

  setDefaultAddress(addressId: number): Observable<AddressResponse> {
    return this.http.patch<AddressResponse>(
      this.apiUrlService.getUrl(`api/profile/addresses/${addressId}/set-default`),
      {}
    );
  }
}
