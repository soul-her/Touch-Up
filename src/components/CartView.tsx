import React from 'react';
import { useCart } from './context/CartContext';
import type { View } from '../types';
import ShoppingBagIcon from './icons/ShoppingBagIcon';
import ShoppingCartIcon from './icons/ShoppingBagIcon';
import UpArrowIcon from './icons/UpArrowIcon';
import DownArrowIcon from './icons/DownArrowIcon';
import CloseIcon from './icons/CloseIcon';


interface CartViewProps {
  setView: (view: View) => void;
}

const CartView: React.FC<CartViewProps> = ({ setView }) => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, getCartItemCount } = useCart();
  const subtotal = getCartTotal();
  const shippingCost = 0; // FREE Shipping
  const total = subtotal + shippingCost;
  const itemCount = getCartItemCount();

  const getProductStyling = (productName: string) => {
    switch (productName) {
      case 'Water Refill':
        return { color: 'bg-blue-500', text: 'Refill' };
      case 'New Gallon':
        return { color: 'bg-green-500', text: 'Gallon' };
      case 'Empty Container Pickup':
        return { color: 'bg-yellow-500', text: 'Pickup' };
      default:
        const words = productName.split(' ');
        return { color: 'bg-gray-500', text: words[0] };
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white text-center p-12 rounded-xl shadow-lg">
          <ShoppingBagIcon />
          <h1 className="text-3xl font-bold mt-6 mb-2 text-gray-800">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">
            Looks like you haven't added anything yet. Let's change that!
          </p>
          <button
            onClick={() => setView('products')}
            className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            Explore Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Your Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
        {/* Cart Items */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 pb-4 border-b">Items ({itemCount})</h2>
          <div className="divide-y divide-gray-200">
            {cartItems.map(item => {
              const { color, text } = getProductStyling(item.name);
              return (
              <div key={item.id} className="flex items-center justify-between py-6">
                <div className="flex items-center gap-4 flex-grow">
                  <div className={`w-16 h-16 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold">{text}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-gray-500">${item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 sm:gap-8">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-gray-800 w-8 text-center">{item.quantity}</span>
                        <div className="flex flex-col">
                            <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                                className="text-gray-500 hover:text-gray-800 p-1"
                                aria-label={`Increase quantity of ${item.name}`}
                                >
                                <UpArrowIcon />
                            </button>
                            <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                                className="text-gray-500 hover:text-gray-800 p-1"
                                aria-label={`Decrease quantity of ${item.name}`}
                                >
                                <DownArrowIcon />
                            </button>
                        </div>
                    </div>
                  
                  <p className="font-bold text-lg w-24 text-right text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>

                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <CloseIcon />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-xl shadow-lg sticky top-28">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b pb-4">
              <ShoppingCartIcon />
              Order Summary
            </h2>
            <div className="space-y-3 text-lg">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
               <div className="flex justify-between font-bold text-gray-800 border-t pt-4 mt-4">
                <span>Order Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-8">
               <button
                onClick={() => setView('checkout')}
                className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md flex flex-col items-center justify-center text-center"
              >
                <span className="text-lg">Proceed to Checkout</span>
                <span className="text-sm font-normal">(${total.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartView;