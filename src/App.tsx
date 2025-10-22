import React, { useState, useEffect } from 'react';
import { CartProvider } from './components/context/CartContext';
import Header from './components/Header';
import ProductList from './components/ProductList';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import AboutView from './components/AboutView';
import LoginView from './components/LoginView';
import Footer from './components/Footer';
import SchedulePickupModal from './components/SchedulePickupModal';
import type { View, Notification, User } from './types';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';


function App() {
  const [view, setView] = useState<View>('products');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [postLoginAction, setPostLoginAction] = useState<View | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showScheduleConfirmation, setShowScheduleConfirmation] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user as User);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSetView = (newView: View) => {
    if (newView === 'checkout' && !currentUser) {
      setPostLoginAction('checkout');
      setView('login');
    } else {
      setPostLoginAction(null);
      setView(newView);
    }
  };

  const handleSchedulePickup = (details: { date: string; time: string; }) => {
      const newNotification: Notification = {
          id: Date.now(),
          message: 'Pickup Scheduled',
          details: `Your container pickup is set for ${details.date} at ${details.time}.`,
          status: 'Pending',
      };

      setNotifications(prev => [newNotification, ...prev]);
      setIsScheduleModalOpen(false);
      
      setShowScheduleConfirmation(true);
      setTimeout(() => setShowScheduleConfirmation(false), 3000);

      // Simulate staff accepting the request
      setTimeout(() => {
          setNotifications(prev => 
              prev.map(n => n.id === newNotification.id ? { ...n, status: 'Accepted', message: 'Pickup Confirmed' } : n)
          );
      }, 10000); // 10 seconds delay
  };

  const renderView = () => {
    if (isLoadingAuth) {
      return <div className="text-center p-20">Loading...</div>;
    }
    switch (view) {
      case 'cart':
        return <CartView setView={handleSetView} />;
      case 'checkout':
        return <CheckoutView setView={handleSetView} currentUser={currentUser} />;
      case 'about':
        return <AboutView />;
      case 'login':
        return <LoginView setView={handleSetView} postLoginAction={postLoginAction} />;
      case 'products':
      default:
        return <ProductList onSchedule={() => setIsScheduleModalOpen(true)} />;
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col font-sans text-gray-800">
        <Header setView={handleSetView} currentUser={currentUser} notifications={notifications} />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderView()}
        </main>
        <Footer />

        {isScheduleModalOpen && (
          <SchedulePickupModal 
            onClose={() => setIsScheduleModalOpen(false)}
            onSchedule={handleSchedulePickup}
          />
        )}
        
        {showScheduleConfirmation && (
            <div className="fixed bottom-5 right-5 bg-green-600 text-white py-3 px-6 rounded-lg shadow-lg z-50 animate-fade-in-out">
                Pickup scheduled! You'll be notified of its confirmation.
            </div>
        )}
      </div>
    </CartProvider>
  );
}

export default App;
