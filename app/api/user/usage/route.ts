import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reset counter if it's a new month (same logic as analysis route)
    const now = new Date();
    const lastReset = new Date(dbUser.lastUploadResetDate ?? 0);
    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      dbUser.uploadsThisMonth = 0;
      dbUser.lastUploadResetDate = now;
      await dbUser.save();
    }

    const bypassLimit = process.env.DEV_BYPASS_LIMIT === "true";

    return NextResponse.json({
      success: true,
      plan: dbUser.plan || "free",
      uploadsThisMonth: bypassLimit ? 0 : (dbUser.uploadsThisMonth || 0),
      limit: 3, // Free tier limit
    });
  } catch (err) {
    console.error("[/api/user/usage] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
