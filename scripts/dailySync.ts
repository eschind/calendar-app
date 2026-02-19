import 'dotenv/config';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { LineupTransformer } from '@/app/lib/lineupTransformer';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

const FOOTBALL_DATA_API_URL = 'https://api.football-data.org/v4';
const MAN_UTD_TEAM_ID = 66;
const API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';

async function fetchApi(endpoint: string) {
  const res = await fetch(`${FOOTBALL_DATA_API_URL}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Update scores for finished matches ─────────────────────────────

async function syncScores() {
  console.log('Syncing match scores...');

  const eventsWithoutScores = await prisma.event.findMany({
    where: {
      homeScore: null,
      date: { lt: new Date() },
      OR: [
        { title: { contains: 'Man Utd vs' } },
        { title: { contains: 'Man Utd @' } },
      ],
    },
  });

  if (eventsWithoutScores.length === 0) {
    console.log('  No matches need score updates.');
    return;
  }

  console.log(`  Found ${eventsWithoutScores.length} match(es) without scores.`);

  const data = await fetchApi(`/teams/${MAN_UTD_TEAM_ID}/matches?status=FINISHED&limit=20`);
  const finishedMatches = data.matches || [];

  for (const event of eventsWithoutScores) {
    // Extract opponent name from title
    const opponentMatch = event.title.match(/Man Utd (?:vs|@) (.+)/);
    if (!opponentMatch) continue;
    const opponent = opponentMatch[1];

    // Find matching finished match from API
    const apiMatch = finishedMatches.find((m: any) => {
      const home = m.homeTeam.shortName || m.homeTeam.name;
      const away = m.awayTeam.shortName || m.awayTeam.name;
      return home.includes(opponent) || away.includes(opponent) ||
             opponent.includes(home) || opponent.includes(away);
    });

    if (!apiMatch || !apiMatch.score?.fullTime) continue;

    const homeScore = apiMatch.score.fullTime.home;
    const awayScore = apiMatch.score.fullTime.away;
    const isHome = event.title.startsWith('Man Utd vs');
    const footballDataId = apiMatch.id;

    await prisma.event.update({
      where: { id: event.id },
      data: {
        homeScore: isHome ? homeScore : awayScore,
        awayScore: isHome ? awayScore : homeScore,
        footballDataId,
        venue: isHome ? 'Home' : 'Away',
      },
    });

    console.log(`  Updated: ${event.title} -> ${isHome ? homeScore : awayScore}-${isHome ? awayScore : homeScore}`);
  }
}

// ─── Sync lineups for recently finished matches ─────────────────────

async function syncLineups() {
  console.log('Syncing lineups...');

  const recentWithScores = await prisma.event.findMany({
    where: {
      homeScore: { not: null },
      footballDataId: { not: null },
      lineup: null,
    },
    include: { lineup: true },
  });

  if (recentWithScores.length === 0) {
    console.log('  No matches need lineup updates.');
    return;
  }

  for (const event of recentWithScores) {
    if (!event.footballDataId) continue;

    try {
      const matchData: any = await fetchApi(`/matches/${event.footballDataId}`);
      const isHome = matchData.homeTeam.id === MAN_UTD_TEAM_ID;
      const teamData = isHome ? matchData.homeTeam : matchData.awayTeam;
      const lineup = teamData.lineup;
      const formation = teamData.formation;

      if (!lineup || lineup.length === 0) continue;

      const transformedPlayers = LineupTransformer.transformLineup(lineup, formation);
      const coach = isHome ? matchData.homeTeam.coach : matchData.awayTeam.coach;

      await prisma.lineup.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          formation,
          players: JSON.stringify(transformedPlayers),
          coach: coach ? JSON.stringify({ name: coach.name, nationality: coach.nationality }) : undefined,
          lastUpdated: new Date(),
        },
        update: {
          formation,
          players: JSON.stringify(transformedPlayers),
          coach: coach ? JSON.stringify({ name: coach.name, nationality: coach.nationality }) : undefined,
          lastUpdated: new Date(),
        },
      });

      console.log(`  Updated lineup: ${event.title} (${formation})`);
    } catch (err) {
      console.log(`  Skipped lineup for ${event.title}: ${err}`);
    }
  }
}

// ─── Add any new scheduled matches ──────────────────────────────────

async function syncUpcomingMatches() {
  console.log('Syncing upcoming matches...');

  const data = await fetchApi(`/teams/${MAN_UTD_TEAM_ID}/matches?status=SCHEDULED&limit=30`);
  const scheduled = data.matches || [];
  let added = 0;

  for (const match of scheduled) {
    const existing = await prisma.event.findUnique({
      where: { footballDataId: match.id },
    });
    if (existing) continue;

    // Also check by title + date to avoid duplicates with seed data
    const isHome = match.homeTeam.id === MAN_UTD_TEAM_ID;
    const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
    const title = isHome ? `Man Utd vs ${opponent}` : `Man Utd @ ${opponent}`;
    const matchDate = new Date(match.utcDate);

    // Check for existing match by date range and opponent substring
    const opponentBase = opponent.replace(/ FC$/, '').replace(/^AFC /, '');
    const existingByTitle = await prisma.event.findFirst({
      where: {
        title: { contains: opponentBase },
        date: {
          gte: new Date(matchDate.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(matchDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingByTitle) {
      // Link the footballDataId if not set
      if (!existingByTitle.footballDataId) {
        await prisma.event.update({
          where: { id: existingByTitle.id },
          data: { footballDataId: match.id },
        });
      }
      continue;
    }

    const endDate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);

    await prisma.event.create({
      data: {
        title,
        date: matchDate,
        startTime: `${String(matchDate.getUTCHours()).padStart(2, '0')}:${String(matchDate.getUTCMinutes()).padStart(2, '0')}`,
        endTime: `${String(endDate.getUTCHours()).padStart(2, '0')}:${String(endDate.getUTCMinutes()).padStart(2, '0')}`,
        description: `Premier League ${isHome ? 'at Old Trafford' : 'fixture'}`,
        venue: isHome ? 'Home' : 'Away',
        footballDataId: match.id,
      },
    });
    added++;
    console.log(`  Added: ${title} on ${matchDate.toISOString().split('T')[0]}`);
  }

  if (added === 0) console.log('  No new matches to add.');
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  const timestamp = new Date().toLocaleString();
  console.log(`\n=== Daily Sync (${timestamp}) ===\n`);

  if (!API_KEY) {
    console.error('FOOTBALL_DATA_API_KEY not set. Skipping match sync.');
  } else {
    await syncScores();
    await syncLineups();
    await syncUpcomingMatches();
  }

  console.log('\nDone.\n');
}

main()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
