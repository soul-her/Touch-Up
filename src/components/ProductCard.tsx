
import React, { useState } from 'react';
import { useCart } from '../components/context/CartContext';
import type { Product } from '../types';
import { iconMap } from '../components/icons/iconMap';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const iconColorClasses: { [key: string]: string } = {
    'Water Refill': 'bg-blue-100',
    'New Gallon': 'bg-gray-200',
    'Empty Container Pickup': 'bg-green-100',
  };

  const IconComponent = iconMap[product.iconName] || iconMap['DefaultIcon'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center transition-shadow hover:shadow-lg">
        <div className={`w-20 h-20 rounded-lg flex items-center justify-center mb-6 ${iconColorClasses[product.name] || 'bg-gray-100'}`}>
            <IconComponent />
        </div>
        <h3 className="font-bold text-xl mb-2 text-gray-900">{product.name}</h3>
        <p className="text-gray-500 text-base flex-grow mb-4">{product.description}</p>
        
        <div className="mt-auto w-full pt-4">
             <div className="flex justify-between items-center w-full">
                <span className="text-xl font-bold text-gray-800">${product.price.toFixed(2)}</span>
                 {product.productType === 'service' ? (
                    <span
                        className="px-4 py-2 rounded-lg font-semibold text-white bg-green-500 cursor-default"
                    >
                        Schedule Below
                    </span>
                ) : (
                    <button
                        onClick={handleAddToCart}
                        className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors duration-300 ${
                        isAdded 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {isAdded ? 'Added!' : 'Add'}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default ProductCard;