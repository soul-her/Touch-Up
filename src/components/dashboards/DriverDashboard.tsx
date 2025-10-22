import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import type { Order, User, OrderStatus } from '../../types';

interface DriverDashboardProps {
  currentUser: User;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ currentUser }) => {
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'orders'),
      where('driverId', '==', currentUser.uid),
      where('status', 'in', ['Assigned', 'Out for Delivery']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setAssignedOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching assigned orders: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("Failed to update order status.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">My Deliveries</h1>

      {isLoading ? (
        <p>Loading assigned deliveries...</p>
      ) : assignedOrders.length === 0 ? (
        <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          <p>You have no active deliveries assigned.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignedOrders.map(order => (
            <div key={order.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <p className="font-bold text-lg text-gray-800">{order.orderId}</p>
                  <p className="text-gray-600">
                    Customer: <span className="font-medium">{order.customerName}</span>
                  </p>
                  <p className="text-gray-600">
                    Address:{' '}
                    <span className="font-medium">
                      {`${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.zip}`}
                    </span>
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-4">
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      order.status === 'Assigned'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status}
                  </span>
                  {order.status === 'Assigned' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'Out for Delivery')}
                      className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Start Delivery
                    </button>
                  )}
                  {order.status === 'Out for Delivery' && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, 'Delivered')}
                      className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard; // 👈 make sure this line exists
