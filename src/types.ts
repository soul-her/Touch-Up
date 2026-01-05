import firebase from "firebase/compat/app";

// General UI types
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

// User and Auth types
export type UserRole = "customer" | "driver" | "staff" | "manager";

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}

// User as stored in the database
export interface DBUser extends User {
  role: UserRole;
  shippingAddress?: ShippingAddress; // legacy profile address (optional)
}

// Product and Cart types
interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  productType?: "item" | "service";
  stock?: number;
  createdAt?: any; // Firestore Timestamp
}


export interface CartItem extends Product {
  quantity: number;
}

// ─────────────────────────────────────────────
// ADDRESS TYPES (IMPORTANT: matches your Firestore order doc)
// ─────────────────────────────────────────────

// This is the address structure you showed inside orders:
// address: { street, barangay, city, province, postalCode, lat, lng }
export interface OrderAddress {
  street?: string;
  barangay?: string; // you use this like area filter
  city?: string;
  province?: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
}

// Old/legacy address type used in some places (keep for profile/pickups if you still use it)
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  zip: string;
}

// ─────────────────────────────────────────────
// ORDER TYPES
// ─────────────────────────────────────────────

// Keep your current statuses + add "completed" to support container pickup logic
export type OrderStatus =
  | "pending"
  | "Placed"
  | "Assigned"
  | "Out for Delivery"
  | "Delivered"
  | "completed";

// Firestore Order document (aligns with your real DB)
export interface Order {
  id: string; // document ID
  userId: string;

  // In your sample doc: name + email exist
  name?: string;
  email?: string;

  // Some screens use customerName; keep optional for compatibility
  customerName?: string;

  // Items & totals (exist in your sample)
  items: CartItem[];
  total: number;
  shippingCost?: number;

  // ✅ matches DB sample
  address?: OrderAddress;

  // status you store
  status: OrderStatus;

  // timestamps
  createdAt: firebase.firestore.Timestamp;

  // staff-assignment fields
  driverId?: string;
  driverName?: string;
  assignedAt?: firebase.firestore.Timestamp;

  // delivery/completion fields (needed for “after 3 days” logic)
  deliveredAt?: firebase.firestore.Timestamp;
  completedAt?: firebase.firestore.Timestamp;

  // container pickup tracking (driver updates this)
  isContainerPickedUp?: boolean;

  // optional: you have this in sample
  distanceKm?: number;
}

// ─────────────────────────────────────────────
// PICKUP TYPES (customer pickup requests, separate from container pickup)
// ─────────────────────────────────────────────

export type PickupStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface Pickup {
  id: string;
  userId: string;
  customerName: string;
  date: string;
  time: string;

  // If your pickups collection uses driverId (your rules do), include it:
  driverId?: string;

  // You currently use ShippingAddress here; keep it
  address: ShippingAddress;

  status: PickupStatus;
  createdAt: firebase.firestore.Timestamp;

  // optional audit fields
  completedAt?: firebase.firestore.Timestamp;
}

// ─────────────────────────────────────────────
// COMPLETED CONTAINER PICKUPS (for 1-week storage + auto-delete)
// ─────────────────────────────────────────────

export interface ContainerPickupRecord {
  id: string; // doc id (often same as orderId)
  orderId: string;

  userId?: string;
  driverId?: string;

  address?: OrderAddress;

  pickedUpAt: firebase.firestore.Timestamp;

  // ✅ for Firestore TTL (auto-delete after 1 week)
  expiresAt: firebase.firestore.Timestamp;
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export type NotificationStatus = "Accepted" | "Pending" | "Declined";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  details: string;
  status: NotificationStatus;
  createdAt: firebase.firestore.Timestamp;
}
