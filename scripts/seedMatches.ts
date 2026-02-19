import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { LineupTransformer } from '@/app/lib/lineupTransformer';

const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

// Manchester United 2025-26 Fixtures
const matches = [
  { date: '2026-02-07', time: '07:30', opponent: 'Tottenham Hotspur', venue: 'Home', homeScore: 2, awayScore: 0 },
  { date: '2026-02-10', time: '15:15', opponent: 'West Ham United', venue: 'Away', homeScore: 1, awayScore: 1 },
  { date: '2026-02-23', time: '15:00', opponent: 'Everton', venue: 'Away' },
  { date: '2026-03-01', time: '09:00', opponent: 'Crystal Palace', venue: 'Home' },
  { date: '2026-03-04', time: '15:15', opponent: 'Newcastle United', venue: 'Away' },
  { date: '2026-03-14', time: '11:00', opponent: 'Aston Villa', venue: 'Home' },
  { date: '2026-03-20', time: '16:00', opponent: 'AFC Bournemouth', venue: 'Away' },
  { date: '2026-04-11', time: '10:00', opponent: 'Leeds United', venue: 'Home' },
  { date: '2026-04-18', time: '10:00', opponent: 'Chelsea', venue: 'Away' },
  { date: '2026-04-25', time: '10:00', opponent: 'Brentford', venue: 'Home' },
  { date: '2026-05-02', time: '10:00', opponent: 'Liverpool', venue: 'Home' },
  { date: '2026-05-09', time: '10:00', opponent: 'Sunderland', venue: 'Away' },
  { date: '2026-05-17', time: '10:00', opponent: 'Nottingham Forest', venue: 'Home' },
  { date: '2026-05-24', time: '11:00', opponent: 'Brighton & Hove Albion', venue: 'Away' },
];

async function seedMatches() {
  console.log('🔴 Seeding Manchester United fixtures...');

  // Delete existing MUFC matches (to avoid duplicates)
  await prisma.event.deleteMany({
    where: {
      title: {
        contains: 'Man Utd vs',
      },
    },
  });

  await prisma.event.deleteMany({
    where: {
      title: {
        contains: 'Man Utd @',
      },
    },
  });

  // Add Fulham match with lineup (Feb 1, 2026 - Match ID: 538021)
  console.log('⚽ Adding Fulham match with starting lineup...');
  const fulhamDate = new Date('2026-02-01');
  fulhamDate.setUTCHours(14, 0, 0, 0); // 2:00 PM UTC (9:00 AM ET)

  const fulhamEndTime = new Date(fulhamDate);
  fulhamEndTime.setUTCHours(16, 0, 0, 0);

  const fulhamEvent = await prisma.event.create({
    data: {
      title: 'Man Utd vs Fulham',
      date: fulhamDate,
      startTime: '14:00',
      endTime: '16:00',
      description: 'Premier League at Old Trafford',
      venue: 'Home',
      footballDataId: 538021,
      homeScore: 3,
      awayScore: 2,
    },
  });

  // Actual 4-2-3-1 lineup (Michael Carrick's system)
  const fulhamLineup = {
    formation: '4-2-3-1',
    players: [
      { id: 1, name: 'André Onana', shirtNumber: 24, position: 'Goalkeeper' },
      { id: 2, name: 'Diogo Dalot', shirtNumber: 20, position: 'Right-Back' },
      { id: 3, name: 'Matthijs de Ligt', shirtNumber: 4, position: 'Centre-Back' },
      { id: 4, name: 'Lisandro Martínez', shirtNumber: 6, position: 'Centre-Back' },
      { id: 5, name: 'Noussair Mazraoui', shirtNumber: 3, position: 'Left-Back' },
      { id: 6, name: 'Casemiro', shirtNumber: 18, position: 'Defensive Midfield' },
      { id: 7, name: 'Kobbie Mainoo', shirtNumber: 37, position: 'Defensive Midfield' },
      { id: 8, name: 'Amad Diallo', shirtNumber: 16, position: 'Right Wing' },
      { id: 9, name: 'Bruno Fernandes', shirtNumber: 8, position: 'Attacking Midfield' },
      { id: 10, name: 'Alejandro Garnacho', shirtNumber: 17, position: 'Left Wing' },
      { id: 11, name: 'Rasmus Højlund', shirtNumber: 11, position: 'Centre-Forward' },
    ],
    coach: { name: 'Michael Carrick' },
  };

  // Transform and save lineup
  const transformedPlayers = LineupTransformer.transformLineup(
    fulhamLineup.players,
    fulhamLineup.formation
  );

  await prisma.lineup.create({
    data: {
      eventId: fulhamEvent.id,
      formation: fulhamLineup.formation,
      players: JSON.stringify(transformedPlayers),
      coach: JSON.stringify(fulhamLineup.coach),
      lastUpdated: new Date(),
    },
  });

  console.log('✅ Added: Man Utd vs Fulham (3-2) with 4-2-3-1 lineup (Carrick) on 2026-02-01 at 9:00 AM ET');

  // Add all matches
  for (const match of matches) {
    const [hours, minutes] = match.time.split(':');
    const matchDate = new Date(match.date);

    // Times are in ET (ESPN default), store them as UTC
    // ET is UTC-5 (or UTC-4 during DST)
    // For simplicity, treating as UTC-5
    matchDate.setUTCHours(parseInt(hours) + 5, parseInt(minutes), 0, 0);

    const title = match.venue === 'Home'
      ? `Man Utd vs ${match.opponent}`
      : `Man Utd @ ${match.opponent}`;

    const endTime = new Date(matchDate);
    endTime.setUTCHours(endTime.getUTCHours() + 2); // Assume 2-hour match duration

    await prisma.event.create({
      data: {
        title,
        date: matchDate,
        startTime: `${String(matchDate.getUTCHours()).padStart(2, '0')}:${String(matchDate.getUTCMinutes()).padStart(2, '0')}`,
        endTime: `${String(endTime.getUTCHours()).padStart(2, '0')}:${String(endTime.getUTCMinutes()).padStart(2, '0')}`,
        description: `Premier League ${match.venue === 'Home' ? 'at Old Trafford' : 'fixture'}`,
        venue: match.venue,
        ...('homeScore' in match && { homeScore: match.homeScore, awayScore: match.awayScore }),
      },
    });

    console.log(`✅ Added: ${title} on ${match.date} at ${match.time} ET`);
  }

  console.log('🎉 All Manchester United fixtures have been added!');
}

seedMatches()
  .catch((e) => {
    console.error('❌ Error seeding matches:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
