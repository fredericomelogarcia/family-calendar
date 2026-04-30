import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Runs daily to clean up old invitations
// Called by Vercel Cron: https://vercel.com/docs/cron
export async function GET(request: NextRequest) {
  try {
    // Delete accepted/expired invitations older than 30 days
    await db.execute(`
      DELETE FROM invitations 
      WHERE status IN ('accepted', 'expired') 
      AND created_at < NOW() - INTERVAL '30 days'
    `);

    // Delete stale pending invitations older than 7 days
    const pendingResult = await db.execute(`
      DELETE FROM invitations 
      WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '7 days'
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Cleanup completed"
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}