
import React, { useState, useMemo, useEffect } from 'react';
import type { DBUser, ShippingAddress, View } from '../types';

interface SchedulePickupFormProps {
  onSchedule: (details: { date: string; time: string; address: ShippingAddress; }) => void;
  currentUser: DBUser | null;
  setView: (view: View) => void;
}

const SchedulePickupForm: React.FC<SchedulePickupFormProps> = ({ onSchedule, currentUser, setView }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [useDifferentAddress, setUseDifferentAddress] = useState(!currentUser?.shippingAddress);
  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: currentUser?.shippingAddress?.fullName || currentUser?.displayName || '',
    address: currentUser?.shippingAddress?.address || '',
    city: currentUser?.shippingAddress?.city || '',
    zip: currentUser?.shippingAddress?.zip || '',
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    // This effect runs when the currentUser object changes (e.g., after login)
    setUseDifferentAddress(!currentUser?.shippingAddress);
    if (currentUser) {
        setAddressForm({
            fullName: currentUser.shippingAddress?.fullName || currentUser.displayName || '',
            address: currentUser.shippingAddress?.address || '',
            city: currentUser.shippingAddress?.city || '',
            zip: currentUser.shippingAddress?.zip || '',
        });
    } else {
        // Reset form if user logs out
        setAddressForm({ fullName: '', address: '', city: '', zip: '' });
    }
  }, [currentUser]);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to schedule a pickup.");
      setView('login');
      return;
    }
    if (selectedDate && time) {
      const pickupAddress = (useDifferentAddress || !currentUser?.shippingAddress) 
        ? addressForm 
        : currentUser.shippingAddress;
        
      if (pickupAddress) {
        onSchedule({
            date: selectedDate.toISOString().split('T')[0],
            time,
            address: pickupAddress
        });
        // Reset form state after successful submission
        setSelectedDate(null);
        setTime('');
      }
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
    }
    return days;
  }, [currentDate]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + offset);
        return newDate;
    });
  };

  const handleDateSelect = (day: Date) => {
    if (day >= today) {
        setSelectedDate(day);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isFormValid = useMemo(() => {
      if (!selectedDate || !time) return false;
      if (useDifferentAddress || !currentUser?.shippingAddress) {
          return addressForm.fullName && addressForm.address && addressForm.city && addressForm.zip;
      }
      return true;
  }, [selectedDate, time, useDifferentAddress, addressForm, currentUser]);

  if (!currentUser) {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Schedule a Pickup</h2>
            <p className="text-gray-600 mb-6">Log in to schedule a pickup for your empty containers.</p>
            <button 
                onClick={() => setView('login')}
                className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
            >
                Login to Schedule
            </button>
        </div>
    )
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Schedule Container Pickup</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Calendar and Time */}
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select a Date</label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    </button>
                    <span className="font-semibold text-lg text-gray-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {weekDays.map(day => <div key={day} className="font-medium text-xs text-gray-500 uppercase">{day}</div>)}
                    {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} />;
                    const isToday = day.getTime() === today.getTime();
                    const isSelected = selectedDate?.getTime() === day.getTime();
                    const isPast = day < today;
                    
                    let classes = 'h-9 w-9 flex items-center justify-center rounded-full transition-colors duration-200 text-sm';
                    if (isPast) {
                        classes += ' text-gray-300 cursor-not-allowed';
                    } else {
                        classes += ' cursor-pointer';
                        if (isSelected) {
                            classes += ' bg-blue-500 text-white font-bold shadow';
                        } else if (isToday) {
                            classes += ' ring-2 ring-blue-500 text-blue-600';
                        } else {
                            classes += ' text-gray-700 hover:bg-blue-100';
                        }
                    }

                    return (
                        <button type="button" key={day.toISOString()} onClick={() => handleDateSelect(day)} disabled={isPast} className={classes}>
                            {day.getDate()}
                        </button>
                    );
                    })}
                </div>
                </div>
            </div>
            <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time Slot</label>
                <select 
                id="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required 
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="">Select a time</option>
                <option value="9:00 AM - 12:00 PM">9:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 3:00 PM">12:00 PM - 3:00 PM</option>
                <option value="3:00 PM - 6:00 PM">3:00 PM - 6:00 PM</option>
                </select>
            </div>
        </div>

        {/* Right Side: Address */}
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address</label>
                {currentUser?.shippingAddress && (
                    <div className="bg-gray-50 p-4 rounded-lg border mb-4 space-y-3">
                        <div className="flex items-start">
                            <input 
                                type="radio" 
                                id="useSavedAddress"
                                name="addressChoice"
                                checked={!useDifferentAddress}
                                onChange={() => setUseDifferentAddress(false)}
                                className="h-4 w-4 mt-1 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="useSavedAddress" className="ml-3 text-sm">
                                <span className="font-medium text-gray-900">Use saved address</span>
                                <div className="text-gray-600 mt-1">
                                    <p>{currentUser.shippingAddress.fullName}</p>
                                    <p>{currentUser.shippingAddress.address}</p>
                                    <p>{currentUser.shippingAddress.city}, {currentUser.shippingAddress.zip}</p>
                                </div>
                            </label>
                        </div>
                        <div className="flex items-start">
                            <input 
                                type="radio" 
                                id="useDifferentAddress"
                                name="addressChoice"
                                checked={useDifferentAddress}
                                onChange={() => setUseDifferentAddress(true)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="useDifferentAddress" className="ml-3 text-sm font-medium text-gray-900">
                            Use a different address
                            </label>
                        </div>
                    </div>
                )}

                {(useDifferentAddress || !currentUser?.shippingAddress) && (
                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                        <div>
                            <input type="text" name="fullName" placeholder="Full Name" required value={addressForm.fullName} onChange={handleAddressInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" />
                        </div>
                        <div>
                            <input type="text" name="address" placeholder="Address" required value={addressForm.address} onChange={handleAddressInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input type="text" name="city" placeholder="City" required value={addressForm.city} onChange={handleAddressInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" />
                            </div>
                            <div>
                                <input type="text" name="zip" placeholder="ZIP Code" required value={addressForm.zip} onChange={handleAddressInputChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="pt-2 md:col-span-2">
                <button
                type="submit"
                className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isFormValid}
                >
                Confirm Pickup
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default SchedulePickupForm;