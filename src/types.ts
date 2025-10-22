import React from "react";
import firebase from "firebase/compat/app";

// ✅ View pages in your app
export type View =
  | "products"
  | "cart"
  | "checkout"
  | "about"
  | "login"
  | "profile"
  | "driver"
  | "staff"
  | "manager";

// ✅ Roles used in Firestore & ProtectedRoute
export type UserRole = "customer" | "driver" | "staff" | "manager";

// ✅ Basic user info from Firebase Auth
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}

// ✅ User data stored in Firestore
export interface DBUser extends User {
  role: UserRole;
}

// ✅ Product and cart items
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: React.FC<any>;
  productType: "item" | "service";
}

export interface CartItem extends Product {
  quantity: number;
}

// ✅ Order tracking types
export type OrderStatus = "Placed" | "Assigned" | "Out for Delivery" | "Delivered";

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  zip: string;
}

export interface Order {
  id: string;
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
}

// ✅ Notification type
export interface Notification {
  id: number;
  message: string;
  details: string;
  status: "Accepted" | "Pending" | "Declined";
}
