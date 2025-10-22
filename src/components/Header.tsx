import React, { useState, useEffect, useRef } from 'react';
import { useCart } from './context/CartContext';
import ShoppingCartIcon from './icons/ShoppingBagIcon';
import BellIcon from './icons/BellIcon';
import ChatIcon from './icons/ChatIcon';
import UserIcon from './icons/UserIcon';
import type { View, Notification, User, UserRole } from '../types';
import { auth } from '../firebase';

interface HeaderProps {
  setView: React.Dispatch<React.SetStateAction<View>>; // ✅ use React.Dispatch for type safety
  currentUser: User | null;
  userRole: UserRole | null;
  notifications: Notification[];
}

const Header: React.FC<HeaderProps> = ({ setView, currentUser, userRole, notifications }) => {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const navLinkClasses = "text-gray-600 hover:text-black transition-colors duration-300";

  // ✅ Logout handler
  const handleLogout = async () => {
    await auth.signOut();
    setIsProfileMenuOpen(false);
    setView('products');
  };
  
  // ✅ Navigation handler for profile/login
  const handleProfileNavigation = (view: View) => {
    setView(view);
    setIsProfileMenuOpen(false);
  };

  // ✅ Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <button onClick={() => setView('products')} className="text-3xl font-bold text-gray-800">
            Touch Up
          </button>
          
          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => setView('products')} className={navLinkClasses}>Home</button>
            <button onClick={() => setView('about')} className={navLinkClasses}>About Us</button>
            {userRole === 'driver' && <button onClick={() => setView('driver')} className={navLinkClasses}>Driver Dashboard</button>}
            {userRole === 'staff' && <button onClick={() => setView('staff')} className={navLinkClasses}>Staff Dashboard</button>}
            {userRole === 'manager' && <button onClick={() => setView('manager')} className={navLinkClasses}>Manager Dashboard</button>}
          </nav>

          {/* Icons / Menus */}
          <div className="flex items-center space-x-6">
            {/* Chat */}
            <button className="text-gray-600 hover:text-black transition-colors">
              <ChatIcon />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationMenuRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-600 hover:text-black transition-colors relative">
                <BellIcon />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
                  <div className="p-3 border-b font-semibold text-gray-700">Notifications</div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                          <p className="font-semibold text-gray-800 flex items-center justify-between">
                            {n.message}
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                n.status === 'Accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : n.status === 'Declined'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {n.status}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">{n.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-gray-500">No new notifications.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button onClick={() => setView('cart')} className="relative text-gray-600 hover:text-black transition-colors">
              <ShoppingCartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
            
            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="text-gray-600 hover:text-black transition-colors">
                <UserIcon />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-20 py-1">
                  {currentUser ? (
                    <>
                      <button onClick={() => handleProfileNavigation('profile')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Account
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Logout
                      </button>
                    </>
                  ) : (
                    <button onClick={() => handleProfileNavigation('login')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
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
  );
};

export default Header;
