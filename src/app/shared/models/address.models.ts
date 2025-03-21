export interface Address {
  id: number;
  name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  type: 'shipping' | 'billing' | 'both';
  full_address: string;
  created_at: string;
}

export interface AddressCreateRequest {
  name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  type: 'shipping' | 'billing' | 'both';
}

export interface AddressUpdateRequest extends AddressCreateRequest {
  id: number;
}

export interface AddressResponse {
  data: Address;
}

export interface AddressesResponse {
  data: Address[];
}
