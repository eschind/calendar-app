import 'dotenv/config';
import { footballDataClient } from '@/app/lib/footballDataClient';

async function fetchFulhamMatch() {
  try {
    console.log('🔍 Searching for Man Utd vs Fulham match...');

    // Fetch recent finished matches for Man Utd
    const response = await footballDataClient.getFinishedMatches(66, 20);

    console.log('📋 Recent matches:', JSON.stringify(response, null, 2));

    // Look for Fulham match around Feb 1, 2026
    const matches = response.matches || [];
    const fulhamMatch = matches.find((match: any) => {
      const opponent = match.homeTeam.id === 66 ? match.awayTeam.name : match.homeTeam.name;
      return opponent.includes('Fulham');
    });

    if (fulhamMatch) {
      console.log('\n⚽ Found Fulham match:');
      console.log('Match ID:', fulhamMatch.id);
      console.log('Date:', fulhamMatch.utcDate);
      console.log('Home:', fulhamMatch.homeTeam.name);
      console.log('Away:', fulhamMatch.awayTeam.name);
      console.log('Score:', fulhamMatch.score?.fullTime);

      // Fetch detailed match data with lineup
      console.log('\n📥 Fetching lineup data...');
      const detailedMatch = await footballDataClient.getMatchById(fulhamMatch.id);
      console.log('\nFull match data:', JSON.stringify(detailedMatch, null, 2));
    } else {
      console.log('❌ No Fulham match found in recent matches');
      console.log('\n🔍 Searching upcoming matches...');
      const upcomingResponse = await footballDataClient.getUpcomingMatches(66);
      console.log('Upcoming matches:', JSON.stringify(upcomingResponse, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching match:', error);
  }
}

fetchFulhamMatch();
