export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
}

export interface Client {
  id: string;
  name: string;
  initialDebt?: number; // Debt manually set at start
  debt: number; // Current calculated debt
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string; // ISO string
}

export enum SaleType {
  NORMAL = 'NORMAL',
  CREDIT = 'CREDIT'
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[]; // New multi-item structure
  clientId?: string;
  clientName?: string;
  totalPrice: number;
  type: SaleType;
  date: string; // ISO string
}

export type ViewState = 'DASHBOARD' | 'PRODUCTS' | 'CLIENTS' | 'SALES' | 'PAYMENTS';