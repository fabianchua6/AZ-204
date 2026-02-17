import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis only if env vars are present (prevents crash on build)
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    })
    : null;

const SYNC_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

interface SyncData {
    quizProgress: Record<string, unknown>;
    answeredQuestions: Record<string, unknown>;
    leitnerProgress: Record<string, unknown>;
    settings: Record<string, unknown>;
    lastSync: string;
}

/**
 * GET /api/sync?code=AZ-XXXXXX
 * Retrieve synced data by sync code
 */
export async function GET(request: NextRequest) {
    if (!redis) {
        return NextResponse.json(
            { success: false, error: 'Sync backend not configured (Redis missing)' },
            { status: 503 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Missing sync code' },
                { status: 400 }
            );
        }

        const syncCode = code.toUpperCase();

        if (!/^AZ-[A-HJ-KM-NP-Z2-9]{6}$/.test(syncCode)) {
            return NextResponse.json(
                { success: false, error: 'Invalid sync code format' },
                { status: 400 }
            );
        }

        const data = await redis.get<SyncData>(`sync:${syncCode}`);

        if (!data) {
            return NextResponse.json({
                success: true,
                data: null,
                lastSync: null,
            });
        }

        return NextResponse.json({
            success: true,
            data,
            lastSync: data.lastSync || null,
        });
    } catch (error) {
        console.error('Error getting sync data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve data' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sync?code=AZ-XXXXXX
 * Save data under a sync code
 */
export async function POST(request: NextRequest) {
    if (!redis) {
        return NextResponse.json(
            { success: false, error: 'Sync backend not configured (Redis missing)' },
            { status: 503 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Missing sync code' },
                { status: 400 }
            );
        }

        const syncCode = code.toUpperCase();

        if (!/^AZ-[A-HJ-KM-NP-Z2-9]{6}$/.test(syncCode)) {
            return NextResponse.json(
                { success: false, error: 'Invalid sync code format' },
                { status: 400 }
            );
        }

        const body = await request.json();

        const syncData: SyncData = {
            quizProgress: body.quizProgress || {},
            answeredQuestions: body.answeredQuestions || {},
            leitnerProgress: body.leitnerProgress || {},
            settings: body.settings || {},
            lastSync: new Date().toISOString(),
        };

        await redis.set(`sync:${syncCode}`, syncData, { ex: SYNC_TTL_SECONDS });

        return NextResponse.json({
            success: true,
            message: 'Data synced successfully',
            lastSync: syncData.lastSync,
        });
    } catch (error) {
        console.error('Error saving sync data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save data' },
            { status: 500 }
        );
    }
}
