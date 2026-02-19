'use client';

import { useEffect, useState } from 'react';
import { Lineup } from '../types';
import LineupDisplay from './LineupDisplay';

interface LineupPopoverProps {
  eventId: string;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function LineupPopover({ eventId, onClose, position }: LineupPopoverProps) {
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    fetchLineup();
  }, [eventId]);

  useEffect(() => {
    // Adjust position to ensure popover stays on screen
    const popoverWidth = 500;
    const popoverHeight = 650;
    const padding = 20;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newTop = position.top;
    let newLeft = position.left;

    // Check if popover would go off right edge
    if (newLeft + popoverWidth / 2 > viewportWidth - padding) {
      newLeft = viewportWidth - popoverWidth - padding;
    }

    // Check if popover would go off left edge
    if (newLeft - popoverWidth / 2 < padding) {
      newLeft = popoverWidth / 2 + padding;
    }

    // Check if popover would go off bottom edge
    if (newTop + popoverHeight / 2 > viewportHeight - padding) {
      newTop = viewportHeight - popoverHeight / 2 - padding;
    }

    // Check if popover would go off top edge
    if (newTop - popoverHeight / 2 < padding) {
      newTop = popoverHeight / 2 + padding;
    }

    setAdjustedPosition({ top: newTop, left: newLeft });
  }, [position]);

  const fetchLineup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lineups?eventId=${eventId}`);

      if (response.ok) {
        const data = await response.json();
        setLineup(data);
      } else if (response.status === 404) {
        setError('Lineup not yet available');
      } else {
        setError('Failed to load lineup');
      }
    } catch (err) {
      console.error('Error fetching lineup:', err);
      setError('Failed to load lineup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Popover */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl border-4 overflow-hidden"
        style={{
          top: `${adjustedPosition.top}px`,
          left: `${adjustedPosition.left}px`,
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '650px',
          borderColor: '#DA291C',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: '#000000',
            border: '2px solid #FFD700',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFD700'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000'}
        >
          <span className="text-lg font-bold" style={{ color: '#FFD700' }}>×</span>
        </button>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto"
                style={{ borderColor: '#DA291C', borderTopColor: 'transparent' }}
              />
              <p className="mt-4 font-semibold" style={{ color: '#DA291C' }}>
                Loading lineup...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div
              className="text-center p-6 rounded-lg border-2"
              style={{ borderColor: '#DA291C', backgroundColor: '#FFF5F5' }}
            >
              <p className="font-bold text-lg" style={{ color: '#DA291C' }}>
                {error}
              </p>
              <p className="text-sm mt-2 text-gray-600">
                Lineups are typically available closer to match time
              </p>
            </div>
          </div>
        )}

        {lineup && !loading && !error && (
          <LineupDisplay lineup={lineup} />
        )}
      </div>
    </>
  );
}
