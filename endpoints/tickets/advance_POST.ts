import { schema, OutputType } from "./advance_POST.schema";
import { db } from "../../helpers/db";
import { getTechnicianFromRequest } from "../../helpers/technicianSession";
import superjson from "superjson";

const NEXT_STATUS: Record<string, { status: string; timestampColumn: "arrivedAt" | "startedAt" | "completedAt" } | null> = {
  Accepted: { status: "Arrived", timestampColumn: "arrivedAt" },
  Arrived: { status: "InProgress", timestampColumn: "startedAt" },
  InProgress: { status: "Completed", timestampColumn: "completedAt" },
  Completed: null,
};

export async function handle(request: Request) {
  try {
    const technician = await getTechnicianFromRequest(request);
    if (!technician) {
      return new Response(superjson.stringify({ error: "Not authenticated." }), {
        status: 401,
      });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const ticket = await db
      .selectFrom("tickets")
      .selectAll()
      .where("id", "=", input.ticketId)
      .where("technicianId", "=", technician.id)
      .executeTakeFirst();

    if (!ticket) {
      return new Response(superjson.stringify({ error: "Ticket not found." }), {
        status: 404,
      });
    }

    const next = NEXT_STATUS[ticket.status];
    if (!next) {
      return new Response(superjson.stringify({ error: "This job is already completed." }), {
        status: 400,
      });
    }

    const updated = await db
      .updateTable("tickets")
      .set({
        status: next.status as typeof ticket.status,
        [next.timestampColumn]: new Date(),
        updatedAt: new Date(),
      })
      .where("id", "=", ticket.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updated satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}