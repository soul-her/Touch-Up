import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface AdminAddProductProps {
  onProductAdded?: () => void;
}

const AdminAddProduct: React.FC<AdminAddProductProps> = ({ onProductAdded }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [imageURL, setImageURL] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "products"), {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        image: imageURL, // just use provided URL
        productType: "item",
        createdAt: serverTimestamp(),
      });

      alert("✅ Product added successfully!");
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setImageURL("");

      if (onProductAdded) onProductAdded();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("❌ Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-5">Add New Product</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full border p-2 rounded"
        />

        <input
          type="url"
          placeholder="Image URL (optional)"
          value={imageURL}
          onChange={(e) => setImageURL(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {imageURL && (
          <img
            src={imageURL}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg mb-2"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AdminAddProduct;
