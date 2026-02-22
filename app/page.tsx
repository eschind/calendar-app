'use client';

import { useState, useEffect } from 'react';
import WeekView from './components/WeekView';
import AgendaView from './components/AgendaView';
import { CalendarEvent } from './types';

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
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

  const currentWeek = getCurrentWeek();
  const weekRange = `${currentWeek[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${currentWeek[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Toolbar */}
      <div className="border-b bg-white" style={{ borderColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between">
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
          </div>

          {/* Mobile layout */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="px-2.5 py-1.5 rounded text-sm font-medium border"
                style={{ color: '#333', borderColor: '#D5D5D5', backgroundColor: '#FFFFFF' }}
              >
                ←
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 rounded text-sm font-semibold text-white"
                style={{ backgroundColor: '#DA291C' }}
              >
                Today
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="px-2.5 py-1.5 rounded text-sm font-medium border"
                style={{ color: '#333', borderColor: '#D5D5D5', backgroundColor: '#FFFFFF' }}
              >
                →
              </button>
            </div>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="px-2 py-1.5 rounded text-xs border font-medium min-w-0"
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
        </div>
      </div>

      {/* Desktop: week grid */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <WeekView
            events={events}
            currentWeek={currentWeek}
            timezone={timezone}
          />
        </div>
      </div>

      {/* Mobile: agenda list */}
      <div className="block md:hidden max-w-2xl mx-auto">
        <AgendaView events={events} timezone={timezone} />
      </div>
    </div>
  );
}
