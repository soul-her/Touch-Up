import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image?: string;
  imageURL?: string;
}

const AdminEditProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [edited, setEdited] = useState<Partial<Product>>({
    image: "",
  });

  // ✅ Load all products in real time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const data = snap.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Product)
      );
      setProducts(data);
    });
    return () => unsub();
  }, []);

  // ✅ Start editing
  const handleEditClick = (product: Product) => {
    setSelected(product);
    setEdited({
      name: product.name || "",
      price: product.price || 0,
      category: product.category || "",
      description: product.description || "",
      image: product.image || product.imageURL || "",
    });
  };

  // ✅ Save edits
  const handleSave = async () => {
    if (!selected) return;
    try {
      const updateData = {
        ...edited,
        image: edited.image || "",
      };
      await updateDoc(doc(db, "products", selected.id), updateData);
      alert("✅ Product updated successfully!");
      setSelected(null);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("❌ Failed to update product.");
    }
  };

  // ✅ Delete product
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      alert("🗑️ Product deleted successfully!");
      if (selected?.id === id) setSelected(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("❌ Failed to delete product.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        🧰 Manage Products
      </h2>

      {!selected ? (
        <ul className="divide-y divide-gray-200">
          {products.map((p) => (
            <li
              key={p.id}
              className="py-3 flex justify-between items-center hover:bg-gray-50 transition px-2"
            >
              <div className="flex items-center gap-3">
                {p.image || p.imageURL ? (
                  <img
                    src={p.image || p.imageURL}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-gray-600 text-sm">₱{p.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(p)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">
            ✏️ Editing Product: <span className="text-blue-600">{selected.name}</span>
          </h3>

          {/* --- FORM --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={edited.name ?? ""}
                onChange={(e) => setEdited({ ...edited, name: e.target.value })}
                placeholder="Product name"
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Price (₱)
              </label>
              <input
                type="number"
                value={edited.price ?? 0}
                onChange={(e) =>
                  setEdited({ ...edited, price: parseFloat(e.target.value) })
                }
                placeholder="Price"
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Category
              </label>
              <input
                type="text"
                value={edited.category ?? ""}
                onChange={(e) => setEdited({ ...edited, category: e.target.value })}
                placeholder="Category"
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={edited.image ?? ""}
                onChange={(e) => setEdited({ ...edited, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="border p-2 w-full rounded"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={edited.description ?? ""}
              onChange={(e) => setEdited({ ...edited, description: e.target.value })}
              placeholder="Product description"
              className="border p-2 w-full rounded min-h-[80px]"
            />
          </div>

          {/* Image Preview */}
          {edited.image && (
            <div className="flex flex-col items-start">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Preview
              </label>
              <img
                src={edited.image}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              Save
            </button>
            <button
              onClick={() => setSelected(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(selected.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditProducts;
