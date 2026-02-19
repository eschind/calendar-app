'use client';

import { CalendarEvent } from '../types';

interface WeekViewProps {
  events: CalendarEvent[];
  currentWeek: Date[];
  onDateClick: (date: Date, hour: number) => void;
  onDeleteEvent: (eventId: string) => void;
  timezone: string;
}

export default function WeekView({ events, currentWeek, onDateClick, onDeleteEvent, timezone }: WeekViewProps) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // Start at 6am, show 18 hours
  const CELL_HEIGHT = 60; // pixels

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const convertTimeToTimezone = (date: Date, timeString: string) => {
    // Parse the time string (e.g., "09:30")
    // Stored times are in UTC
    const [hours, minutes] = timeString.split(':').map(Number);

    // Create a new date using UTC components to avoid DST issues
    const dateWithTime = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
      0,
      0
    ));

    // Format in the selected timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return formatter.format(dateWithTime);
  };

  const getTimezoneHour = (date: Date, timeString: string): number => {
    const convertedTime = convertTimeToTimezone(date, timeString);
    const [hours] = convertedTime.split(':').map(Number);
    return hours;
  };

  const getTimezoneMinutes = (date: Date, timeString: string): number => {
    const convertedTime = convertTimeToTimezone(date, timeString);
    const [, minutes] = convertedTime.split(':').map(Number);
    return minutes;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    // Convert times to selected timezone
    const startHour = getTimezoneHour(event.date, event.startTime);
    const startMin = getTimezoneMinutes(event.date, event.startTime);
    const endHour = getTimezoneHour(event.date, event.endTime);
    const endMin = getTimezoneMinutes(event.date, event.endTime);

    // Calculate position relative to 6am (first hour)
    const startOffset = (startHour - 6) + (startMin / 60);
    const endOffset = (endHour - 6) + (endMin / 60);

    const top = startOffset * CELL_HEIGHT;
    const height = (endOffset - startOffset) * CELL_HEIGHT;

    return { top, height };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b" style={{ borderColor: '#E5E5E5' }}>
          <div className="p-3" style={{ backgroundColor: '#FAFAFA' }}></div>
          {currentWeek.map((date, index) => (
            <div
              key={index}
              className="p-3 text-center border-l"
              style={{
                borderColor: '#E5E5E5',
                backgroundColor: isToday(date) ? '#FFF5F5' : '#FFFFFF',
              }}
            >
              <div className="text-xs font-medium uppercase tracking-wider" style={{ color: '#888888' }}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className="text-xl mt-0.5 font-bold"
                style={{ color: isToday(date) ? '#DA291C' : '#1A1A1A' }}
              >
                {date.getDate()}
              </div>
              <div className="text-xs" style={{ color: '#AAAAAA' }}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots and events */}
        <div className="relative">
          <div className="grid grid-cols-8">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div
                  className="p-2 text-right text-xs font-medium border-b"
                  style={{
                    backgroundColor: '#FAFAFA',
                    color: '#999999',
                    borderColor: '#F0F0F0',
                    height: `${CELL_HEIGHT}px`
                  }}
                >
                  {formatTime(hour)}
                </div>
                {currentWeek.map((date, dayIndex) => (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="border-l border-b cursor-pointer transition-colors"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#F0F0F0',
                      height: `${CELL_HEIGHT}px`
                    }}
                    onClick={() => onDateClick(date, hour)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFF5F5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Render events as absolutely positioned overlays */}
          {currentWeek.map((date, dayIndex) => {
            const dayEvents = getEventsForDay(date);
            return dayEvents.map((event) => {
              const { top, height } = calculateEventPosition(event);

              // Display times in selected timezone
              const displayStartTime = convertTimeToTimezone(event.date, event.startTime);
              const displayEndTime = convertTimeToTimezone(event.date, event.endTime);

              return (
                <div
                  key={event.id}
                  className="absolute pointer-events-auto group rounded-sm"
                  style={{
                    left: `calc((100% / 8) * ${dayIndex + 1} + 2px)`,
                    width: `calc(100% / 8 - 6px)`,
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: '#DA291C',
                    borderLeft: '3px solid #B71C1C',
                    zIndex: 10,
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="h-full w-full flex flex-col justify-center px-2 text-white relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event.id);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                      title="Delete event"
                    >
                      <span className="text-xs font-bold text-white">×</span>
                    </button>
                    <div className="font-semibold text-sm leading-tight">{event.title}</div>
                    {event.homeScore !== undefined && event.awayScore !== undefined && (
                      <div className="font-bold text-base text-white">
                        {event.homeScore} - {event.awayScore}
                      </div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {displayStartTime} - {displayEndTime}
                    </div>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
