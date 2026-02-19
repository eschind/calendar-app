const FOOTBALL_DATA_API_URL = 'https://api.football-data.org/v4';
const MAN_UTD_TEAM_ID = 66; // Manchester United's ID in football-data.org

export class FootballDataClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FOOTBALL_DATA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FOOTBALL_DATA_API_KEY not set');
    }
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${FOOTBALL_DATA_API_URL}${endpoint}`, {
      headers: {
        'X-Auth-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Football Data API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getMatchById(matchId: number) {
    return this.fetch(`/matches/${matchId}`);
  }

  async getMatchLineup(matchId: number) {
    // Note: Lineups are part of the match detail endpoint
    const match = await this.fetch(`/matches/${matchId}`);
    return match;
  }

  async getUpcomingMatches(teamId: number = MAN_UTD_TEAM_ID) {
    return this.fetch(`/teams/${teamId}/matches?status=SCHEDULED`);
  }

  async getFinishedMatches(teamId: number = MAN_UTD_TEAM_ID, limit: number = 10) {
    return this.fetch(`/teams/${teamId}/matches?status=FINISHED&limit=${limit}`);
  }
}

export const footballDataClient = new FootballDataClient();
