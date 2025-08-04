import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    // Modern Supabase handles cookies automatically through the client
    // This endpoint is no longer needed with current auth implementation
    return NextResponse.json({ message: 'Cookies handled by client' }, { status: 200 })
} 