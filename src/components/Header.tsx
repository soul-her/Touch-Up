import React, { useState, useEffect, useRef } from "react";
import { useCart } from "./context/CartContext";
import ShoppingCartIcon from "./icons/ShoppingBagIcon";
import UserIcon from "./icons/UserIcon";
import type { View, User, UserRole } from "../types";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

// ✅ Import your sections
import OurProcess from "./OurProcess";
import AboutSection from "./AboutSection";
import HistorySection from "./HistorySection";
import ContactSection from "./ContactSection";

interface HeaderProps {
  setView: React.Dispatch<React.SetStateAction<View>>;
  currentUser: User | null;
  userRole: UserRole | null;
}

const Header: React.FC<HeaderProps> = ({ setView, currentUser, userRole }) => {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount ? getCartItemCount() || 0 : 0;

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navLinkClasses =
    "text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300";

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileMenuOpen(false);
      setView("products");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("An error occurred while logging out. Please try again.");
    }
  };

  const handleProfileNavigation = (view: View) => {
    setView(view);
    setIsProfileMenuOpen(false);
  };

  // ✅ Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Render the selected section
  const renderActiveSection = () => {
    switch (activeSection) {
      case "about":
        return <AboutSection />;
      case "process":
        return <OurProcess />;
      case "history":
        return <HistorySection />;
      case "contact":
        return <ContactSection />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 🔹 Header Bar */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <button
              onClick={() => {
                setView("products");
                setActiveSection(null);
              }}
              className="text-3xl font-bold text-blue-600 hover:text-blue-700 transition-colors duration-300"
            >
              Touch Up
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => {
                  setView("products");
                  setActiveSection(null);
                }}
                className={navLinkClasses}
              >
                Home
              </button>

              <button
                onClick={() => setActiveSection("about")}
                className={navLinkClasses}
              >
                About Us
              </button>

              <button
                onClick={() => setActiveSection("process")}
                className={navLinkClasses}
              >
                Our Process
              </button>

              <button
                onClick={() => setActiveSection("history")}
                className={navLinkClasses}
              >
                History
              </button>

              <button
                onClick={() => setActiveSection("contact")}
                className={navLinkClasses}
              >
                Contact
              </button>

              {userRole === "driver" && (
                <button
                  onClick={() => setView("driver")}
                  className={navLinkClasses}
                >
                  Driver Dashboard
                </button>
              )}
              {userRole === "staff" && (
                <button
                  onClick={() => setView("staff")}
                  className={navLinkClasses}
                >
                  Staff Dashboard
                </button>
              )}
              {userRole === "manager" && (
                <button
                  onClick={() => setView("manager")}
                  className={navLinkClasses}
                >
                  Manager Dashboard
                </button>
              )}
            </nav>

            {/* Right-side Icons */}
            <div className="flex items-center space-x-6">
              {/* Cart */}
              <button
                onClick={() => setView("cart")}
                className="relative text-gray-600 hover:text-black transition-colors"
                style={{ transform: "scale(0.8)" }}
              >
                <ShoppingCartIcon />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  <UserIcon />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-20 py-1">
                    {currentUser ? (
                      <>
                        <button
                          onClick={() => handleProfileNavigation("profile")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          My Account
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleProfileNavigation("login")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Login / Sign Up
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 🔹 Only show the chosen section */}
      {activeSection && (
        <main className="relative z-30 bg-gray-50 py-16 px-6 mt-20">
          {renderActiveSection()}
        </main>
      )}
    </>
  );
};

export default Header;
