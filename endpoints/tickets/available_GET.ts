import { OutputType } from "./available_GET.schema";
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

  const tickets = await db
    .selectFrom("tickets")
    .selectAll()
    .where("status", "=", "Assigned")
    .where("technicianId", "is", null)
    .orderBy("createdAt", "asc")
    .execute();

  return new Response(superjson.stringify(tickets satisfies OutputType));
}