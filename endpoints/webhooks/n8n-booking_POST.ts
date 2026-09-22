import { schema, OutputType } from "./n8n-booking_POST.schema";
import { createTicketRecord } from "../../helpers/createTicket";

// Called by the n8n WhatsApp booking workflow's HTTP Request node whenever a
// customer completes a booking. Plain JSON in, plain JSON out -- n8n does
// not speak superjson, so this endpoint deliberately does not use it
// (contrast every other endpoint in this app, which does).
export async function handle(request: Request) {
  try {
    // N8N_WEBHOOK_SECRET comes from a requested external credential the user
    // connects themselves; cast until they do so this typechecks immediately
    // (the generated process.env type only gains the property once connected).
    const secret = (process.env as Record<string, string | undefined>).N8N_WEBHOOK_SECRET;
    if (!secret) {
      console.error("N8N_WEBHOOK_SECRET is not set -- rejecting all webhook calls until it is.");
      return Response.json({ ok: false, error: "Webhook not configured." } satisfies OutputType, { status: 503 });
    }

    // The backend sends this shared secret as `X-N8N-Secret`; header names
    // are read case-insensitively, but the name itself must match.
    const providedSecret = request.headers.get("x-n8n-secret");
    if (providedSecret !== secret) {
      return Response.json({ ok: false, error: "Invalid webhook secret." } satisfies OutputType, { status: 401 });
    }

    const json = await request.json();
    const input = schema.parse(json);

    const ticket = await createTicketRecord(input);

    return Response.json({ ok: true, ticket } satisfies OutputType);
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message } satisfies OutputType,
      { status: 400 },
    );
  }
}