import React, { useState } from 'react';
import { useCart } from './context/CartContext';
import ShoppingCartIcon from './icons/ShoppingBagIcon';
import BellIcon from './icons/BellIcon';
import ChatIcon from './icons/ChatIcon';
import type { View, Notification, User } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  setView: (view: View) => void;
  currentUser: User | null;
  notifications: Notification[];
}

const Header: React.FC<HeaderProps> = ({ setView, currentUser, notifications }) => {
  const { getCartItemCount } = useCart();
  const itemCount = getCartItemCount();
  const [showNotifications, setShowNotifications] = useState(false);

  const navLinkClasses = "text-gray-600 hover:text-black transition-colors duration-300";

  const handleLogout = async () => {
    await signOut(auth);
    setView('products');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button onClick={() => setView('products')} className="text-3xl font-bold text-gray-800">
            Touch Up
          </button>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => setView('products')} className={navLinkClasses}>Home</button>
            <button onClick={() => setView('about')} className={navLinkClasses}>About Us</button>
            <button onClick={() => {}} className={navLinkClasses}>Contact</button>
            {currentUser ? (
              <button onClick={handleLogout} className={navLinkClasses}>Logout</button>
            ) : (
              <button onClick={() => setView('login')} className={navLinkClasses}>Profile</button>
            )}
          </nav>

          <div className="flex items-center space-x-6">
            <button className="text-gray-600 hover:text-black transition-colors">
              <ChatIcon />
            </button>
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-600 hover:text-black transition-colors">
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
                              notifications.map(n => (
                                  <div key={n.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                                      <p className="font-semibold text-gray-800 flex items-center justify-between">
                                          {n.message} 
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            n.status === 'Accepted' ? 'bg-green-100 text-green-800' 
                                            : n.status === 'Declined' ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                          }`}>
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
            <button onClick={() => setView('cart')} className="relative text-gray-600 hover:text-black transition-colors">
              <ShoppingCartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs rounded-full">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
