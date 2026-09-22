import { schema, OutputType } from "./accept_POST.schema";
import { db } from "../../helpers/db";
import { getTechnicianFromRequest } from "../../helpers/technicianSession";
import superjson from "superjson";

// Real pricing: a pack of 6 leads costs ₹500 (+ ₹90 GST, GST excluded from
// this per-lead math). ₹500 / 6 = ~83.33 per lead = 8333 paise.
// This is the technician's cost per lead, deducted from their wallet on
// accept -- it is deliberately independent of a ticket's customer-facing
// `bookingFee` (what the customer pays), which is a different number.
const LEAD_COST_PAISE = 8333;

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

    if (technician.leadsRemaining <= 0) {
      return new Response(
        superjson.stringify({ error: "You have no leads remaining. Recharge to accept more jobs." }),
        { status: 402 },
      );
    }

    const targetTicket = await db
      .selectFrom("tickets")
      .select("id")
      .where("id", "=", input.ticketId)
      .executeTakeFirst();
    if (!targetTicket) {
      return new Response(superjson.stringify({ error: "Lead not found." }), { status: 404 });
    }
    if (technician.walletPaise < LEAD_COST_PAISE) {
      return new Response(
        superjson.stringify({ error: "Insufficient wallet balance. Recharge your wallet to accept more jobs." }),
        { status: 402 },
      );
    }

    const existingActive = await db
      .selectFrom("tickets")
      .select("id")
      .where("technicianId", "=", technician.id)
      .where("status", "!=", "Completed")
      .executeTakeFirst();
    if (existingActive) {
      return new Response(
        superjson.stringify({ error: "Finish your current job before accepting a new one." }),
        { status: 409 },
      );
    }

    const ticket = await db.transaction().execute(async (trx) => {
      const claimed = await trx
        .updateTable("tickets")
        .set({ technicianId: technician.id, status: "Accepted", acceptedAt: new Date(), updatedAt: new Date() })
        .where("id", "=", input.ticketId)
        .where("technicianId", "is", null)
        .where("status", "=", "Assigned")
        .returningAll()
        .executeTakeFirst();

      if (!claimed) {
        return null;
      }

      await trx
        .updateTable("technicians")
        .set((eb) => ({
          leadsRemaining: eb("leadsRemaining", "-", 1),
          walletPaise: eb("walletPaise", "-", LEAD_COST_PAISE),
        }))
        .where("id", "=", technician.id)
        .execute();

      return claimed;
    });

    if (!ticket) {
      return new Response(
        superjson.stringify({ error: "This lead was already taken by another technician." }),
        { status: 409 },
      );
    }

    return new Response(superjson.stringify(ticket satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}