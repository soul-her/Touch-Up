
import React from 'react';
import ProductCard from './ProductCard';
import SchedulePickupForm from './SchedulePickupForm';
import type { Product, DBUser, ShippingAddress, View } from '../types';

interface ProductListProps {
  products: Product[];
  onSchedule: (details: { date: string; time: string; address: ShippingAddress; }) => void;
  currentUser: DBUser | null;
  setView: (view: View) => void;
}


const ProductList: React.FC<ProductListProps> = ({ products, onSchedule, currentUser, setView }) => {
  return (
    <div>
      <section className="relative text-center text-white p-12 md:p-20 rounded-2xl mb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1530539943805-ce9242b6a22f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" aria-hidden="true"></div>
        <div className="absolute inset-0 bg-blue-900/60 rounded-2xl" aria-hidden="true"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Pure Water Delivered</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Seamless water delivery for a healthy and hydrated life.
          </p>
        </div>
      </section>
      
      <h2 className="text-3xl font-bold mb-10 text-gray-800">Our Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <section className="mt-20">
        <SchedulePickupForm onSchedule={onSchedule} currentUser={currentUser} setView={setView} />
      </section>

    </div>
  );
};

export default ProductList;