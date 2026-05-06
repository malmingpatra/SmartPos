
export enum Role {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  GUDANG_MASTER = 'Gudang Master',
  KASIR = 'Kasir',
  SALES = 'Sales',
  GUDANG = 'Gudang'
}

export function normalizeRole(role: string | undefined | null): Role {
  if (!role) return Role.KASIR; // Default role
  const r = role.toLowerCase();
  if (r === 'admin') return Role.ADMIN;
  if (r === 'manager') return Role.MANAGER;
  if (r === 'gudang master') return Role.GUDANG_MASTER;
  if (r === 'kasir') return Role.KASIR;
  if (r === 'sales') return Role.SALES;
  if (r === 'gudang') return Role.GUDANG;
  
  // Also handle exact enum values if they differ from lowercase
  if (role === Role.ADMIN) return Role.ADMIN;
  if (role === Role.MANAGER) return Role.MANAGER;
  if (role === Role.GUDANG_MASTER) return Role.GUDANG_MASTER;
  if (role === Role.KASIR) return Role.KASIR;
  if (role === Role.SALES) return Role.SALES;
  if (role === Role.GUDANG) return Role.GUDANG;

  return Role.KASIR;
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface CartItem extends Pick<Product, 'id' | 'name' | 'price'> {
  quantity: number;
}

// Metadata for RBAC support in Customer management (points removed)
export interface Customer {
  id: string;
  name: string;
  phone: string;
  total_spent: number;
  created_at: string;
  created_by: string;      // ID User pembuat
  created_by_role: Role;   // Role pembuat
}

export interface Order {
  id: string;
  receipt_number: string;
  user_id: string;
  user_name: string;
  total_amount: number;
  discount: number;
  items: CartItem[];
  created_at: string;
  buyer_name?: string;
  buyer_phone?: string;
  customer_id?: string; // Link to customer table if member
}

export interface SalesReport {
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  user_stats: { [userName: string]: number };
}
