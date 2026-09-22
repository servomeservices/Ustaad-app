import { OutputType } from "./mine_GET.schema";
import { db } from "../../helpers/db";
import { getTechnicianFromRequest } from "../../helpers/technicianSession";
import superjson from "superjson";

export async function handle(request: Request) {
  const technician = await getTechnicianFromRequest(request);
  if (!technician) {
    return new Response(superjson.stringify({ error: "Not authenticated." }), {
      status: 401,
    });
  }

  const ticket = await db
    .selectFrom("tickets")
    .selectAll()
    .where("technicianId", "=", technician.id)
    .where("status", "!=", "Completed")
    .orderBy("createdAt", "desc")
    .executeTakeFirst();

  return new Response(superjson.stringify((ticket ?? null) satisfies OutputType));
}