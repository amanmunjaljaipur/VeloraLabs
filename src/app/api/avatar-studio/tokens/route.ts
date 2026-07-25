import { auth } from "@/auth";
import { getBalance, getLedgerForUser } from "@/lib/avatar-studio/token-ledger-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [balance, ledger] = await Promise.all([
    getBalance(session.user.email),
    getLedgerForUser(session.user.email, 50),
  ]);

  return NextResponse.json({ balance, ledger });
}
