import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        lineup: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Parse JSON fields in lineups
    const eventsWithParsedLineups = events.map(event => ({
      ...event,
      lineup: event.lineup ? {
        ...event.lineup,
        players: JSON.parse(event.lineup.players),
        coach: event.lineup.coach ? JSON.parse(event.lineup.coach) : undefined,
      } : undefined,
    }));

    return NextResponse.json(eventsWithParsedLineups);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date, startTime, endTime, description } = body;

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        startTime,
        endTime,
        description: description || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
