'use client';

import { Lineup, PlayerPosition } from '../types';

interface LineupDisplayProps {
  lineup: Lineup;
}

export default function LineupDisplay({ lineup }: LineupDisplayProps) {
  const GRID_ROWS = 5;
  const GRID_COLS = 5;

  // Create grid structure for positioning
  const grid: (PlayerPosition | null)[][] = Array(GRID_ROWS)
    .fill(null)
    .map(() => Array(GRID_COLS).fill(null));

  // Place players in grid
  lineup.players.forEach((player) => {
    const { row, col } = player.gridPosition;
    if (row >= 1 && row <= GRID_ROWS && col >= 0 && col < GRID_COLS) {
      grid[row - 1][col] = player;
    }
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div
        className="px-4 py-3 border-b-2"
        style={{ backgroundColor: '#DA291C', borderColor: '#000000' }}
      >
        <h3 className="text-lg font-bold text-white">Starting Lineup</h3>
        <p className="text-sm" style={{ color: '#FFD700' }}>
          Formation: {lineup.formation}
        </p>
      </div>

      {/* Football Pitch */}
      <div
        className="flex-1 p-4 relative"
        style={{
          background: 'linear-gradient(180deg, #1a5f1a 0%, #0d400d 100%)',
        }}
      >
        {/* Pitch markings */}
        <div className="absolute inset-4 border-2 border-white opacity-40 rounded-lg">
          {/* Center circle */}
          <div
            className="absolute border-2 border-white rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
            }}
          />
          {/* Center line */}
          <div
            className="absolute border-t-2 border-white w-full"
            style={{ top: '50%' }}
          />
          {/* Penalty box (top) */}
          <div
            className="absolute border-2 border-white"
            style={{
              top: '0',
              left: '25%',
              width: '50%',
              height: '15%',
              borderBottom: 'none',
            }}
          />
          {/* Penalty box (bottom) */}
          <div
            className="absolute border-2 border-white"
            style={{
              bottom: '0',
              left: '25%',
              width: '50%',
              height: '15%',
              borderTop: 'none',
            }}
          />
        </div>

        {/* Player Grid */}
        <div className="relative h-full flex flex-col justify-between py-8">
          {grid.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex justify-around items-center"
              style={{ minHeight: '60px' }}
            >
              {row.map((player, colIndex) => (
                <div
                  key={colIndex}
                  className="flex-1 flex justify-center"
                >
                  {player && (
                    <div
                      className="flex flex-col items-center transform hover:scale-110 transition-transform cursor-pointer"
                      title={`${player.name} - ${player.position}`}
                    >
                      {/* Jersey circle */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2"
                        style={{
                          backgroundColor: '#DA291C',
                          borderColor: '#000000',
                        }}
                      >
                        {player.jerseyNumber}
                      </div>
                      {/* Player name */}
                      <div
                        className="mt-1 text-xs font-semibold text-center px-2 py-1 rounded max-w-[100px] truncate"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: '#FFD700',
                        }}
                      >
                        {player.name.split(' ').pop()}
                      </div>
                      {/* Position */}
                      <div
                        className="text-xs font-bold"
                        style={{ color: '#FFFFFF' }}
                      >
                        {player.positionAbbr}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer with coach info */}
      {lineup.coach && (
        <div
          className="px-4 py-2 border-t-2 text-sm"
          style={{ backgroundColor: '#000000', borderColor: '#FFD700' }}
        >
          <span className="text-white">Coach: </span>
          <span style={{ color: '#FFD700' }} className="font-semibold">
            {lineup.coach.name}
          </span>
        </div>
      )}
    </div>
  );
}
