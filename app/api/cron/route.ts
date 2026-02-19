import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { footballDataClient } from '@/app/lib/footballDataClient';
import { LineupTransformer } from '@/app/lib/lineupTransformer';

const MAN_UTD_TEAM_ID = 66;
const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron - Daily sync endpoint
// Protect with CRON_SECRET if set, otherwise allow in development
export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const log: string[] = [];
  const push = (msg: string) => { log.push(msg); console.log(msg); };

  try {
    push(`Daily sync started at ${new Date().toISOString()}`);

    // 1. Sync scores
    push('Syncing scores...');
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

    if (eventsWithoutScores.length > 0) {
      const data: any = await footballDataClient.getFinishedMatches(MAN_UTD_TEAM_ID, 20);
      const finishedMatches = data.matches || [];

      for (const event of eventsWithoutScores) {
        const opponentMatch = event.title.match(/Man Utd (?:vs|@) (.+)/);
        if (!opponentMatch) continue;
        const opponent = opponentMatch[1];

        const apiMatch = finishedMatches.find((m: any) => {
          const home = m.homeTeam.shortName || m.homeTeam.name;
          const away = m.awayTeam.shortName || m.awayTeam.name;
          return home.includes(opponent) || away.includes(opponent) ||
                 opponent.includes(home) || opponent.includes(away);
        });

        if (!apiMatch?.score?.fullTime) continue;

        const homeScore = apiMatch.score.fullTime.home;
        const awayScore = apiMatch.score.fullTime.away;
        const isHome = event.title.startsWith('Man Utd vs');

        await prisma.event.update({
          where: { id: event.id },
          data: {
            homeScore: isHome ? homeScore : awayScore,
            awayScore: isHome ? awayScore : homeScore,
            footballDataId: apiMatch.id,
            venue: isHome ? 'Home' : 'Away',
          },
        });

        push(`  Score: ${event.title} -> ${isHome ? homeScore : awayScore}-${isHome ? awayScore : homeScore}`);
      }
    } else {
      push('  No scores to update.');
    }

    // 2. Sync lineups for matches with scores but no lineup
    push('Syncing lineups...');
    const needsLineup = await prisma.event.findMany({
      where: {
        homeScore: { not: null },
        footballDataId: { not: null },
        lineup: null,
      },
      include: { lineup: true },
    });

    for (const event of needsLineup) {
      if (!event.footballDataId) continue;
      try {
        const matchData: any = await footballDataClient.getMatchById(event.footballDataId);
        const isHome = matchData.homeTeam.id === MAN_UTD_TEAM_ID;
        const teamData = isHome ? matchData.homeTeam : matchData.awayTeam;

        if (!teamData.lineup?.length) continue;

        const transformedPlayers = LineupTransformer.transformLineup(teamData.lineup, teamData.formation);
        const coach = teamData.coach;

        await prisma.lineup.upsert({
          where: { eventId: event.id },
          create: {
            eventId: event.id,
            formation: teamData.formation,
            players: JSON.stringify(transformedPlayers),
            coach: coach ? JSON.stringify({ name: coach.name }) : undefined,
            lastUpdated: new Date(),
          },
          update: {
            formation: teamData.formation,
            players: JSON.stringify(transformedPlayers),
            coach: coach ? JSON.stringify({ name: coach.name }) : undefined,
            lastUpdated: new Date(),
          },
        });

        push(`  Lineup: ${event.title} (${teamData.formation})`);
      } catch {
        push(`  Lineup skipped: ${event.title}`);
      }
    }

    if (needsLineup.length === 0) push('  No lineups to update.');

    // 3. Sync upcoming matches
    push('Syncing upcoming matches...');
    const upcoming: any = await footballDataClient.getUpcomingMatches(MAN_UTD_TEAM_ID);
    const scheduled = upcoming.matches || [];
    let added = 0;

    for (const match of scheduled) {
      const existing = await prisma.event.findUnique({
        where: { footballDataId: match.id },
      });
      if (existing) continue;

      const isHome = match.homeTeam.id === MAN_UTD_TEAM_ID;
      const opponent = isHome ? match.awayTeam.name : match.homeTeam.name;
      const title = isHome ? `Man Utd vs ${opponent}` : `Man Utd @ ${opponent}`;
      const matchDate = new Date(match.utcDate);

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
      push(`  Added: ${title}`);
    }

    if (added === 0) push('  No new matches.');

    push('Sync complete.');

    return NextResponse.json({ ok: true, log });
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', log, detail: String(error) },
      { status: 500 }
    );
  }
}
