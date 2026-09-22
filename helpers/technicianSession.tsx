import { db } from "./db";

export interface AuthenticatedTechnician {
  id: string;
  phone: string;
  name: string;
  online: boolean;
  walletPaise: number;
  leadsRemaining: number;
}

export async function getTechnicianFromRequest(
  request: Request,
): Promise<AuthenticatedTechnician | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) return null;

  const row = await db
    .selectFrom("technicianSessions")
    .innerJoin("technicians", "technicians.id", "technicianSessions.technicianId")
    .select([
      "technicians.id",
      "technicians.phone",
      "technicians.name",
      "technicians.online",
      "technicians.walletPaise",
      "technicians.leadsRemaining",
    ])
    .where("technicianSessions.token", "=", token)
    .where("technicianSessions.expiresAt", ">", new Date())
    .executeTakeFirst();

  if (!row) return null;
  return row;
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "").slice(-10);
  if (digits.length !== 10) return null;
  return `+91${digits}`;
}