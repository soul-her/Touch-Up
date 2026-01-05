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
  stock: number;
  productType?: string;
  description?: string;
  image?: string;
  createdAt?: any;
}

const AdminEditProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [edited, setEdited] = useState<Partial<Product>>({});

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
      stock: product.stock || 0,
      productType: product.productType || "",
      description: product.description || "",
      image: product.image || "",
    });
  };

  // ✅ Save edits
  const handleSave = async () => {
    if (!selected) return;

    if (edited.price! < 0 || edited.stock! < 0) {
      alert("⚠️ Price and stock must be non-negative values.");
      return;
    }

    try {
      const updateData = {
        ...edited,
        stock: Number(edited.stock) || 0,
        price: Number(edited.price) || 0,
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
      {!selected ? (
        <>
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            🧰 Manage Products & Stocks
          </h2>

          {products.some((p) => p.stock <= 5) && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg mb-4">
              ⚠️ Some products are low in stock! Please restock soon.
            </div>
          )}

          <ul className="divide-y divide-gray-200">
            {products.map((p) => (
              <li
                key={p.id}
                className="py-3 flex justify-between items-center hover:bg-gray-50 transition px-2"
              >
                <div className="flex items-center gap-3">
                  {p.image ? (
                    <img
                      src={p.image}
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
                    <p className="text-gray-600 text-sm">
                      ₱{p.price.toFixed(2)} • Stock:{" "}
                      <span
                        className={`font-semibold ${
                          p.stock <= 5
                            ? "text-red-600"
                            : "text-gray-800"
                        }`}
                      >
                        {p.stock ?? 0}
                      </span>
                    </p>
                    {p.createdAt && (
                      <p className="text-xs text-gray-400">
                        Added:{" "}
                        {new Date(
                          p.createdAt.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    )}
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
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              ✏️ Editing Product:{" "}
              <span className="text-blue-600">{selected.name}</span>
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:underline"
            >
              ← Back to list
            </button>
          </div>

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
                min={0}
                value={edited.price ?? 0}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    price: parseFloat(e.target.value),
                  })
                }
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min={0}
                value={edited.stock ?? 0}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    stock: parseInt(e.target.value),
                  })
                }
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Product Type
              </label>
              <input
                type="text"
                value={edited.productType ?? ""}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    productType: e.target.value,
                  })
                }
                placeholder="e.g. item, service"
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={edited.image ?? ""}
                onChange={(e) =>
                  setEdited({ ...edited, image: e.target.value })
                }
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
              onChange={(e) =>
                setEdited({ ...edited, description: e.target.value })
              }
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
        </>
      )}
    </div>
  );
};

export default AdminEditProducts;
