import React from 'react';
import firebase from 'firebase/compat/app';

// General UI types
export type View = 'products' | 'cart' | 'checkout' | 'about' | 'login' | 'profile' | 'driver' | 'staff' | 'manager';

// User and Auth types
export type UserRole = 'customer' | 'driver' | 'staff' | 'manager';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}


// User as stored in the database
export interface DBUser extends User {
    role: UserRole;
    shippingAddress?: ShippingAddress;
}


// Product and Cart types
export interface Product {
  id: string; // Firestore document ID
  name: string;
  description: string;
  price: number;
  iconName: string; // Name of the icon component
  productType: 'item' | 'service';
  stock?: number;       // 👈 optional stock count
  image?: string;  
}

export interface CartItem extends Product {
  quantity: number;
}


// Order types
export type OrderStatus =
  | 'pending'
  | 'Placed'
  | 'Assigned'
  | 'Out for Delivery'
  | 'Delivered';


export interface ShippingAddress {
    fullName: string;
    address: string;
    city: string;
    zip: string;
}

export interface Order {
  id: string; // Document ID from Firestore
  orderId: string;
  userId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  createdAt: firebase.firestore.Timestamp;
  driverId?: string;
  driverName?: string;
  completedAt?: firebase.firestore.Timestamp;
  
}

// Pickup type
export interface Pickup {
  id: string;
  userId: string;
  customerName: string;
  date: string;
  time: string;
  address: ShippingAddress;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: firebase.firestore.Timestamp;
}

// Notification type
export interface Notification {
  id: string;
  userId: string;
  message: string;
  details: string;
  status: 'Accepted' | 'Pending' | 'Declined';
  createdAt: firebase.firestore.Timestamp;
}
