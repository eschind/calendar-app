'use client';

import { useState } from 'react';
import { CalendarEvent } from '../types';

interface EventFormProps {
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
  initialDate?: Date;
  initialHour?: number;
}

export default function EventForm({ onSave, onCancel, initialDate, initialHour }: EventFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(
    initialDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    initialHour !== undefined
      ? `${String(initialHour).padStart(2, '0')}:00`
      : '09:00'
  );
  const [endTime, setEndTime] = useState(
    initialHour !== undefined
      ? `${String(initialHour + 1).padStart(2, '0')}:00`
      : '10:00'
  );
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      date: new Date(date),
      startTime,
      endTime,
      description,
    });
  };

  const inputClasses = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4" style={{ backgroundColor: '#DA291C' }}>
          <h2 className="text-lg font-bold text-white">Create Event</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#333' }}>
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClasses}
              style={{ borderColor: '#D5D5D5' }}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#333' }}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClasses}
              style={{ borderColor: '#D5D5D5' }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#333' }}>
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClasses}
                style={{ borderColor: '#D5D5D5' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#333' }}>
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClasses}
                style={{ borderColor: '#D5D5D5' }}
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#333' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClasses}
              style={{ borderColor: '#D5D5D5' }}
              placeholder="Enter event description (optional)"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors"
              style={{ backgroundColor: '#DA291C' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B71C1C'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DA291C'}
            >
              Save Event
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium border transition-colors"
              style={{ color: '#333', borderColor: '#D5D5D5', backgroundColor: '#FFFFFF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
