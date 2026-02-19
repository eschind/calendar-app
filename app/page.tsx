'use client';

import { useState, useEffect } from 'react';
import WeekView from './components/WeekView';
import EventForm from './components/EventForm';
import { CalendarEvent } from './types';

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedHour, setSelectedHour] = useState<number | undefined>();
  const [timezone, setTimezone] = useState<string>('Asia/Jerusalem');

  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    setCurrentWeekStart(startOfWeek);

    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.map((e: CalendarEvent) => ({
          ...e,
          date: new Date(e.date),
        })));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const getCurrentWeek = (): Date[] => {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    setCurrentWeekStart(startOfWeek);
  };

  const handleDateClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setShowEventForm(true);
  };

  const handleSaveEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (response.ok) {
        await fetchEvents();
        setShowEventForm(false);
        setSelectedDate(undefined);
        setSelectedHour(undefined);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleCancelEvent = () => {
    setShowEventForm(false);
    setSelectedDate(undefined);
    setSelectedHour(undefined);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const currentWeek = getCurrentWeek();
  const weekRange = `${currentWeek[0].toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })} - ${currentWeek[6].toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      <div className="border-b bg-white" style={{ borderColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors border"
                style={{ color: '#333', borderColor: '#D5D5D5', backgroundColor: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                ← Prev
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-1.5 rounded text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#DA291C' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#B71C1C'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DA291C'}
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors border"
                style={{ color: '#333', borderColor: '#D5D5D5', backgroundColor: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
              >
                Next →
              </button>
              <div className="w-px h-6 mx-1" style={{ backgroundColor: '#D5D5D5' }} />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="px-3 py-1.5 rounded text-sm border font-medium"
                style={{ color: '#333', borderColor: '#D5D5D5', backgroundColor: '#FFFFFF' }}
              >
                <option value="Asia/Jerusalem">Israel (IST)</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Australia/Sydney">Sydney (AEDT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
              {weekRange}
            </div>
            <button
              onClick={() => setShowEventForm(true)}
              className="text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors"
              style={{ backgroundColor: '#1A1A1A' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DA291C'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
            >
              + New Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <WeekView
            events={events}
            currentWeek={currentWeek}
            onDateClick={handleDateClick}
            onDeleteEvent={handleDeleteEvent}
            timezone={timezone}
          />
        </div>
      </div>

      {showEventForm && (
        <EventForm
          onSave={handleSaveEvent}
          onCancel={handleCancelEvent}
          initialDate={selectedDate}
          initialHour={selectedHour}
        />
      )}
    </div>
  );
}
