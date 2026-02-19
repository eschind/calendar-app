interface GridPosition {
  row: number;
  col: number;
}

interface PlayerPosition {
  id: number;
  name: string;
  jerseyNumber: number;
  position: string;
  positionAbbr: string;
  gridPosition: GridPosition;
}

export class LineupTransformer {
  /**
   * Converts API lineup to internal format with grid positioning
   */
  static transformLineup(apiLineup: any[], formation: string): PlayerPosition[] {
    const players: PlayerPosition[] = [];
    const positionCounts: Record<string, number> = {};

    // Extract starting XI
    apiLineup.forEach((player: any) => {
      const positionAbbr = this.getPositionAbbreviation(player.position);

      // Track position count for indexing
      if (!positionCounts[positionAbbr]) {
        positionCounts[positionAbbr] = 0;
      }
      const positionIndex = positionCounts[positionAbbr];
      positionCounts[positionAbbr]++;

      const gridPosition = this.calculateGridPosition(
        positionAbbr,
        formation,
        positionIndex
      );

      players.push({
        id: player.id,
        name: player.name,
        jerseyNumber: player.shirtNumber,
        position: player.position,
        positionAbbr,
        gridPosition,
      });
    });

    return players;
  }

  /**
   * Maps full position names to abbreviations
   */
  private static getPositionAbbreviation(position: string): string {
    const positionMap: Record<string, string> = {
      'Goalkeeper': 'GK',
      'Centre-Back': 'CB',
      'Left-Back': 'LB',
      'Right-Back': 'RB',
      'Defensive Midfield': 'CDM',
      'Central Midfield': 'CM',
      'Attacking Midfield': 'CAM',
      'Left Midfield': 'LM',
      'Right Midfield': 'RM',
      'Left Wing': 'LW',
      'Right Wing': 'RW',
      'Centre-Forward': 'ST',
      'Striker': 'ST',
    };

    return positionMap[position] || position.slice(0, 3).toUpperCase();
  }

  /**
   * Calculates grid position for pitch visualization
   * Supports common formations: 4-2-3-1, 4-3-3, 4-4-2, 3-5-2
   */
  private static calculateGridPosition(
    positionAbbr: string,
    formation: string,
    positionIndex: number
  ): GridPosition {
    const formationMap = this.getFormationMap(formation);

    // Get positions for this abbreviation
    if (formationMap[positionAbbr] && formationMap[positionAbbr][positionIndex]) {
      return formationMap[positionAbbr][positionIndex];
    }

    // Default fallback positioning
    return { row: 3, col: 2 };
  }

  /**
   * Formation-specific positioning logic
   * Row 1 = Goalkeeper, Row 5 = Forwards
   * Cols 0-4 = Left to Right
   */
  private static getFormationMap(formation: string): Record<string, GridPosition[]> {
    // 4-2-3-1 formation
    if (formation === '4-2-3-1') {
      return {
        'GK': [{ row: 1, col: 2 }],
        'LB': [{ row: 2, col: 0 }],
        'CB': [{ row: 2, col: 1 }, { row: 2, col: 3 }],
        'RB': [{ row: 2, col: 4 }],
        'CDM': [{ row: 3, col: 1 }, { row: 3, col: 3 }],
        'LW': [{ row: 4, col: 0 }],
        'CAM': [{ row: 4, col: 2 }],
        'RW': [{ row: 4, col: 4 }],
        'ST': [{ row: 5, col: 2 }],
      };
    }

    // 4-3-3 formation
    if (formation === '4-3-3') {
      return {
        'GK': [{ row: 1, col: 2 }],
        'LB': [{ row: 2, col: 0 }],
        'CB': [{ row: 2, col: 1 }, { row: 2, col: 3 }],
        'RB': [{ row: 2, col: 4 }],
        'CM': [{ row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
        'CDM': [{ row: 3, col: 2 }],
        'LW': [{ row: 5, col: 0 }],
        'ST': [{ row: 5, col: 2 }],
        'RW': [{ row: 5, col: 4 }],
      };
    }

    // 3-4-3 formation
    if (formation === '3-4-3') {
      return {
        'GK': [{ row: 1, col: 2 }],
        'CB': [{ row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }],
        'RM': [{ row: 3, col: 4 }],
        'CM': [{ row: 3, col: 1 }, { row: 3, col: 3 }],
        'LM': [{ row: 3, col: 0 }],
        'RW': [{ row: 5, col: 4 }],
        'ST': [{ row: 5, col: 2 }],
        'LW': [{ row: 5, col: 0 }],
      };
    }

    // 4-4-2 formation
    if (formation === '4-4-2') {
      return {
        'GK': [{ row: 1, col: 2 }],
        'LB': [{ row: 2, col: 0 }],
        'CB': [{ row: 2, col: 1 }, { row: 2, col: 3 }],
        'RB': [{ row: 2, col: 4 }],
        'LM': [{ row: 3, col: 0 }],
        'CM': [{ row: 3, col: 1 }, { row: 3, col: 3 }],
        'RM': [{ row: 3, col: 4 }],
        'ST': [{ row: 5, col: 1 }, { row: 5, col: 3 }],
      };
    }

    // Generic fallback
    return {
      'GK': [{ row: 1, col: 2 }],
      'LB': [{ row: 2, col: 0 }],
      'CB': [{ row: 2, col: 1 }, { row: 2, col: 3 }],
      'RB': [{ row: 2, col: 4 }],
      'CDM': [{ row: 3, col: 2 }],
      'CM': [{ row: 3, col: 1 }, { row: 3, col: 3 }],
      'CAM': [{ row: 4, col: 2 }],
      'LW': [{ row: 4, col: 0 }],
      'RW': [{ row: 4, col: 4 }],
      'ST': [{ row: 5, col: 2 }],
    };
  }
}
