export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  description?: string;
  lineup?: Lineup;
  footballDataId?: number;
  venue?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface Lineup {
  id: string;
  eventId: string;
  formation: string;
  players: PlayerPosition[];
  coach?: Coach;
  lastUpdated: Date;
}

export interface PlayerPosition {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  positionAbbr: string;
  gridPosition: GridPosition;
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface Coach {
  name: string;
  nationality?: string;
}
