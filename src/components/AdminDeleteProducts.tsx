import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
}

const AdminDeleteProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const data = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(data);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("🗑️ Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, "products", id));
      alert("✅ Product deleted successfully!");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🗑️ Delete Products</h2>
      <ul className="divide-y divide-gray-200">
        {products.map((p) => (
          <li key={p.id} className="py-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-gray-600">₱{p.price.toFixed(2)}</p>
            </div>
            <button
              onClick={() => handleDelete(p.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDeleteProducts;
