// FIX: Import React to provide the React namespace for types like React.FC.
import type React from 'react';
import type { UserCredential } from 'firebase/auth';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: React.FC;
  productType: 'item' | 'service';
}

export interface CartItem extends Product {
  quantity: number;
}

export type View = 'products' | 'cart' | 'checkout' | 'about' | 'login';

export interface Notification {
    id: number;
    message: string;
    details: string;
    status: 'Pending' | 'Accepted' | 'Declined';
}

// FIX: An interface can only extend an identifier, not a complex type. Changed to a type alias.
export type User = UserCredential['user'];