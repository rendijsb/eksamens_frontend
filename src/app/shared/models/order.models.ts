import {PaginationMeta} from "./pagination.models";

export interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: PaymentStatus;
  transaction_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: any;
  billing_address: any;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product_id?: number;
  product_name: string;
  product_price: number;
  product_sale_price?: number;
  quantity: number;
  total_price: number;
  product?: {
    id: number;
    name: string;
    slug: string;
    image: string | null;
  };
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface OrdersResponse {
  data: Order[];
  meta: PaginationMeta;
}

export interface OrderResponse {
  data: Order;
}
