import React, { useState, useEffect, useCallback } from "react";
import { CartProvider } from "./components/context/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductList from "./components/ProductList";
import CartView from "./components/CartView";
import CheckoutView from "./components/CheckoutView";
import AboutView from "./components/AboutView";
import LoginView from "./components/LoginView";
import ProfileView from "./components/ProfileView";
import DriverDashboard from "./components/dashboards/DriverDashboard";
import StaffDashboard from "./components/dashboards/StaffDashboard";
import ManagerDashboard from "./components/dashboards/ManagerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import WaterSplashBackground from "./components/WaterSplashBackground";

import { auth, db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import type { View, Notification, DBUser, ShippingAddress, Product } from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<View>("products");
  const [currentUser, setCurrentUser] = useState<DBUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [postLoginAction, setPostLoginAction] = useState<View | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // ✅ Fetch products
  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const productsData = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Product)
      );
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ✅ Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsAuthLoading(true);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        const dbUser: DBUser = {
          uid: user.uid,
          displayName: user.displayName ?? "Unknown",
          email: user.email ?? "",
          role: "customer",
        };

        if (userDoc.exists()) {
          Object.assign(dbUser, userDoc.data());
        }

        setCurrentUser(dbUser);

        if (postLoginAction) {
          setView(postLoginAction);
          setPostLoginAction(null);
        } else {
          const role = dbUser.role;
          if (role === "manager" || role === "staff" || role === "driver") {
            setView(role);
          } else {
            setView("products");
          }
        }
      } else {
        setCurrentUser(null);
        setView("products");
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [postLoginAction]);

  // ✅ Notifications listener
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userNotifications = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
            } as Notification)
        );
        setNotifications(userNotifications);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Schedule pickup
  const handleConfirmSchedule = async (details: {
    date: string;
    time: string;
    address: ShippingAddress;
  }) => {
    if (!currentUser) {
      alert("You must be logged in to schedule a pickup.");
      setView("login");
      return;
    }

    try {
      await addDoc(collection(db, "pickups"), {
        userId: currentUser.uid,
        customerName: currentUser.displayName || "N/A",
        date: details.date,
        time: details.time,
        address: details.address,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", currentUser.uid),
        { shippingAddress: details.address },
        { merge: true }
      );

      await addDoc(collection(db, "notifications"), {
        userId: currentUser.uid,
        message: "Pickup Scheduled",
        details: `For ${details.date} at ${details.time} to ${details.address.address}`,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      alert("Pickup scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling pickup: ", error);
      alert("Failed to schedule pickup. Please try again.");
    }
  };

  const getDashboardTitle = (view: View): string | null => {
    switch (view) {
      case "driver":
        return "My Deliveries";
      case "staff":
        return "Order Fulfillment";
      case "manager":
        return "Manager Dashboard";
      default:
        return null;
    }
  };

  // ✅ View rendering
  const renderView = () => {
    const userRole = currentUser?.role ?? null;
    switch (view) {
      case "cart":
        return <CartView setView={setView} />;
      case "checkout":
        return currentUser ? (
          <CheckoutView setView={setView} currentUser={currentUser} />
        ) : (
          <LoginView setView={setView} postLoginAction="checkout" />
        );
      case "about":
        return <AboutView />;
      case "login":
        return <LoginView setView={setView} postLoginAction={postLoginAction} />;
      case "profile":
        return currentUser ? (
          <ProfileView currentUser={currentUser} />
        ) : (
          <LoginView setView={setView} postLoginAction="profile" />
        );
      case "driver":
        return (
          <ProtectedRoute allowedRoles={["driver", "manager"]} userRole={userRole}>
            {currentUser && <DriverDashboard currentUser={currentUser} />}
          </ProtectedRoute>
        );
      case "staff":
        return (
          <ProtectedRoute allowedRoles={["staff", "manager"]} userRole={userRole}>
            <StaffDashboard />
          </ProtectedRoute>
        );
      case "manager":
        return (
          <ProtectedRoute allowedRoles={["manager"]} userRole={userRole}>
            <ManagerDashboard currentUser={currentUser} />
          </ProtectedRoute>
        );
      default:
        return isProductsLoading ? (
          <div className="text-center">Loading products...</div>
        ) : (
          <ProductList
            products={products}
            onSchedule={handleConfirmSchedule}
            currentUser={currentUser}
            setView={setView}
          />
        );
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const dashboardTitle = getDashboardTitle(view);
  const userRole = currentUser?.role ?? null;

  return (
    <CartProvider>
      {/* ✅ Water Splash Animated Background */}
      <div className="relative min-h-screen overflow-hidden">
        <WaterSplashBackground />

        {/* ✅ Foreground Content */}
        <div className="relative z-10 flex flex-col min-h-screen font-sans">
          {/* ✅ Hide Header on dashboards */}
          {view !== "manager" && view !== "driver" && view !== "staff" && (
            <Header
              setView={setView}
              currentUser={currentUser}
              userRole={userRole}
              notifications={notifications}
            />
          )}

          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {dashboardTitle && (
              <h1 className="text-3xl font-bold text-gray-800 mb-6">{dashboardTitle}</h1>
            )}
            {renderView()}
          </main>

          {/* ✅ Hide Footer on dashboards */}
          {view !== "manager" && view !== "driver" && view !== "staff" && <Footer />}
        </div>
      </div>
    </CartProvider>
  );
};

export default App;
