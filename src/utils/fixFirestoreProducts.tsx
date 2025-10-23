import { db } from "../firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

/**
 * One-time script to fix Firestore product documents.
 * It ensures each document has numeric price and stock values.
 */
export const fixFirestoreProducts = async () => {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
      console.log("⚠️ No products found in Firestore.");
      return;
    }

    const batch = writeBatch(db);
    let fixedCount = 0;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const updates: any = {};

      // Fix price
      if (typeof data.price !== "number") {
        const parsedPrice = Number(data.price);
        updates.price = isNaN(parsedPrice) ? 0 : parsedPrice;
      }

      // Fix stock
      if (typeof data.stock !== "number") {
        const parsedStock = Number(data.stock);
        updates.stock = isNaN(parsedStock) ? 0 : parsedStock;
      }

      // Add missing defaults
      if (!data.name) updates.name = "Unnamed Product";
      if (!data.description) updates.description = "No description available.";
      if (!data.iconName) updates.iconName = "RefillIcon";
      if (!data.productType) updates.productType = "item";

      if (Object.keys(updates).length > 0) {
        batch.update(doc(db, "products", docSnap.id), updates);
        fixedCount++;
      }
    });

    if (fixedCount > 0) {
      await batch.commit();
      console.log(`✅ Fixed ${fixedCount} product(s) in Firestore.`);
    } else {
      console.log("✅ All products already valid. No changes made.");
    }
  } catch (error) {
    console.error("❌ Error fixing Firestore products:", error);
  }
};
