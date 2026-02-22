'use client';

import { CalendarEvent } from '../types';

interface Props {
  events: CalendarEvent[];
  timezone: string;
}

function formatKickoff(date: Date, startTime: string, timezone: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, m
  ));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(utcDate);
}

function groupByMonth(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = new Date(event.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }
  return Array.from(map.entries());
}

export default function AgendaView({ events, timezone }: Props) {
  const now = new Date();
  const groups = groupByMonth(events);

  return (
    <div className="flex flex-col pb-6">
      {groups.map(([month, monthEvents]) => (
        <div key={month}>
          <div
            className="px-4 pt-5 pb-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: '#999' }}
          >
            {month}
          </div>
          <div className="flex flex-col gap-2 px-4">
            {monthEvents.map((event) => {
              const hasScore = event.homeScore !== null && event.homeScore !== undefined;
              const isToday = new Date(event.date).toDateString() === now.toDateString();
              const kickoff = formatKickoff(new Date(event.date), event.startTime, timezone);
              const dayLabel = new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'short', day: 'numeric', month: 'short',
              });

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-lg border"
                  style={{
                    borderColor: isToday ? '#DA291C' : '#E5E5E5',
                    borderLeftWidth: '4px',
                    borderLeftColor: hasScore ? '#DA291C' : isToday ? '#DA291C' : '#E0E0E0',
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#999' }}>
                        {dayLabel}
                      </span>
                      {event.venue && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: event.venue === 'Home' ? '#FFF0F0' : '#F5F5F5',
                            color: event.venue === 'Home' ? '#DA291C' : '#666',
                          }}
                        >
                          {event.venue}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-base leading-snug" style={{ color: '#1A1A1A' }}>
                      {event.title}
                    </div>
                    <div className="mt-2">
                      {hasScore ? (
                        <span className="text-2xl font-black" style={{ color: '#DA291C' }}>
                          {event.homeScore} – {event.awayScore}
                        </span>
                      ) : (
                        <span className="text-sm font-medium" style={{ color: '#777' }}>
                          {kickoff}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
