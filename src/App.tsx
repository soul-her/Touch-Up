import React, { useState, useEffect } from "react";
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
import SchedulePickupModal from "./components/SchedulePickupModal";
import ProtectedRoute from "./components/ProtectedRoute";

import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import type { View, User, UserRole, Notification, DBUser } from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<View>("products");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [postLoginAction, setPostLoginAction] = useState<View | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      message: "Delivery Accepted",
      details: "Your delivery for tomorrow is confirmed.",
      status: "Accepted",
    },
    {
      id: 2,
      message: "Pickup Pending",
      details: "Your container pickup is scheduled for Friday.",
      status: "Pending",
    },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          let role: UserRole = "customer";
          if (userDocSnap.exists()) {
            const dbUser = userDocSnap.data() as DBUser;
            role = dbUser.role;
            setUserRole(role);
          } else {
            setUserRole("customer");
          }

          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
          });

          if (postLoginAction) {
            setView(postLoginAction);
            setPostLoginAction(null);
          } else {
          if (role === "manager") setView("manager");
        else if (role === "staff") setView("staff");
        else if (role === "driver") setView("driver");
        else setView("products");
          }

        } catch (err) {
          console.error("Error fetching user role:", err);
          setUserRole("customer");
          setView("products");
        }
      } else {
        // User signed out
        setCurrentUser(null);
        setUserRole(null);
        setView("products");
      }

      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [postLoginAction]);

  const handleSchedule = () => {
    if (currentUser) {
      setIsScheduling(true);
    } else {
      setPostLoginAction("products");
      alert("Please log in to schedule a pickup.");
      setView("login");
    }
  };

  const handleConfirmSchedule = (details: { date: string; time: string }) => {
    console.log("Scheduled pickup:", details);
    setNotifications((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: "Pickup Scheduled",
        details: `For ${details.date} at ${details.time}`,
        status: "Pending",
      },
    ]);
    setIsScheduling(false);
  };

  const renderView = () => {
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
      case "products":
      default:
        return <ProductList onSchedule={handleSchedule} />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Header
          setView={setView}
          currentUser={currentUser}
          userRole={userRole}
          notifications={notifications}
        />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderView()}
        </main>
        <Footer />

        {isScheduling && (
          <SchedulePickupModal
            onClose={() => setIsScheduling(false)}
            onSchedule={handleConfirmSchedule}
          />
        )}
      </div>
    </CartProvider>
  );
};

export default App;
