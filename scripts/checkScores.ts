import { prisma } from '../app/lib/prisma';

async function checkScores() {
  const events = await prisma.event.findMany({
    where: {
      title: {
        contains: 'Fulham',
      },
    },
  });

  console.log('Fulham match data:');
  console.log(JSON.stringify(events, null, 2));

  await prisma.$disconnect();
}

checkScores();
