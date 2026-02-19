import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { footballDataClient } from '@/app/lib/footballDataClient';
import { LineupTransformer } from '@/app/lib/lineupTransformer';

// GET /api/lineups?eventId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const lineup = await prisma.lineup.findUnique({
      where: { eventId },
    });

    if (!lineup) {
      return NextResponse.json(
        { error: 'Lineup not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    return NextResponse.json({
      ...lineup,
      players: JSON.parse(lineup.players),
      coach: lineup.coach ? JSON.parse(lineup.coach) : undefined,
    });
  } catch (error) {
    console.error('Error fetching lineup:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lineup' },
      { status: 500 }
    );
  }
}

// POST /api/lineups - Create/update lineup for an event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, footballDataId } = body;

    if (!eventId || !footballDataId) {
      return NextResponse.json(
        { error: 'eventId and footballDataId are required' },
        { status: 400 }
      );
    }

    // Fetch lineup from football-data.org
    const matchData = await footballDataClient.getMatchLineup(footballDataId);

    // Determine which team is Man Utd (home or away)
    const isHomeTeam = matchData.homeTeam.id === 66; // Man Utd team ID
    const lineup = isHomeTeam
      ? matchData.homeTeam.lineup
      : matchData.awayTeam.lineup;

    if (!lineup || lineup.length === 0) {
      return NextResponse.json(
        { error: 'Lineup not yet available' },
        { status: 404 }
      );
    }

    // Transform lineup data
    const formation = isHomeTeam
      ? matchData.homeTeam.formation
      : matchData.awayTeam.formation;

    const transformedPlayers = LineupTransformer.transformLineup(
      lineup,
      formation
    );

    // Upsert lineup
    const savedLineup = await prisma.lineup.upsert({
      where: { eventId },
      create: {
        eventId,
        formation,
        players: JSON.stringify(transformedPlayers),
        lastUpdated: new Date(),
      },
      update: {
        formation,
        players: JSON.stringify(transformedPlayers),
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({
      ...savedLineup,
      players: JSON.parse(savedLineup.players),
    });
  } catch (error) {
    console.error('Error creating/updating lineup:', error);
    return NextResponse.json(
      { error: 'Failed to process lineup' },
      { status: 500 }
    );
  }
}
