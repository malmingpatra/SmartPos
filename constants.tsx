
import { Role, Product, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '11111111-1111-4111-a111-111111111111', name: 'Premium Coffee Bean', category: 'Coffee', price: 150000, stock: 45 },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Fresh Milk 1L', category: 'Dairy', price: 25000, stock: 120 },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Organic Matcha Powder', category: 'Tea', price: 210000, stock: 15 },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Dark Chocolate Bar', category: 'Snacks', price: 45000, stock: 60 },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Eco-friendly Cup', category: 'Misc', price: 5000, stock: 500 },
  { id: '66666666-6666-4666-a666-666666666666', name: 'Baguette', category: 'Bakery', price: 18000, stock: 30 },
  { id: '77777777-7777-4777-a777-777777777777', name: 'Croissant', category: 'Bakery', price: 12000, stock: 40 },
  { id: '88888888-8888-4888-a888-888888888888', name: 'Espresso Machine Cleaner', category: 'Misc', price: 85000, stock: 20 },
  { id: '99999999-9999-4999-a999-999999999999', name: 'Iced Tea Syrup', category: 'Beverage', price: 32000, stock: 85 },
  { id: 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa', name: 'Paper Napkins (Pack)', category: 'Misc', price: 15000, stock: 150 },
  { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', name: 'Caramel Sauce', category: 'Beverage', price: 42000, stock: 12 },
  { id: 'cccccccc-cccc-4ccc-bccc-cccccccccccc', name: 'Almond Milk', category: 'Dairy', price: 38000, stock: 24 },
];

export const INITIAL_USERS: User[] = [
  { 
    id: 'dddddddd-dddd-4ddd-bddd-dddddddddddd', 
    name: 'System Admin', 
    username: 'admin',
    pin: '12345', 
    role: Role.ADMIN
  },
  { 
    id: 'eeeeeeee-eeee-4eee-beee-eeeeeeeeeeee', 
    name: 'Ani Kasir', 
    username: 'ani',
    pin: '00000', 
    role: Role.KASIR
  },
  { 
    id: 'ffffffff-ffff-4fff-bfff-ffffffffffff', 
    name: 'Budi Sales', 
    username: 'budi',
    pin: '11111', 
    role: Role.SALES
  },
  { 
    id: '00000000-0000-4000-b000-000000000000', 
    name: 'Gudang Master', 
    username: 'gudang1',
    pin: '22222', 
    role: Role.GUDANG
  },
];

export const APP_CONFIG = {
  PAGE_SIZE: 10,
  HISTORY_LIMIT: 100,
};
