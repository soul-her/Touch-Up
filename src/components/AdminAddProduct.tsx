import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

interface AdminAddProductProps {
  onProductAdded?: () => void; // optional callback to refresh product list
}

const AdminAddProduct: React.FC<AdminAddProductProps> = ({ onProductAdded }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [productType, setProductType] = useState("item");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const storage = getStorage();

  // 🔹 Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // 🔹 Submit new product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageURL = "";
      if (file) imageURL = await uploadImage(file);

      await addDoc(collection(db, "products"), {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        productType,
        image: imageURL,
        createdAt: serverTimestamp(),
      });

      alert("✅ Product added successfully!");
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setProductType("item");
      setFile(null);

      if (onProductAdded) onProductAdded(); // refresh parent
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
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) =>
            setStock(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full border p-2 rounded"
        />

        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="item">Item</option>
          <option value="service">Service</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border p-2 rounded"
        />

        {file && (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg mb-2"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AdminAddProduct;
