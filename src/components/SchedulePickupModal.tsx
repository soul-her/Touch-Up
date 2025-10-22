import React, { useState, useMemo } from 'react';

interface SchedulePickupModalProps {
  onClose: () => void;
  onSchedule: (details: { date: string; time: string; }) => void;
}

const SchedulePickupModal: React.FC<SchedulePickupModalProps> = ({ onClose, onSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // For calendar navigation
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && time) {
      onSchedule({
        date: selectedDate.toISOString().split('T')[0],
        time,
      });
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days = [];
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center px-4"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Schedule Container Pickup</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedDate || !time}
            >
              Confirm Pickup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulePickupModal;