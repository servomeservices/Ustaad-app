import { schema, OutputType } from "./create_POST.schema";
import { createTicketRecord } from "../../helpers/createTicket";
import { getTechnicianFromRequest } from "../../helpers/technicianSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    // Creating a ticket from inside the app is a staff/dispatcher action
    // (e.g. logging a walk-in or phone-in booking) and requires a logged-in
    // technician session, same as every other mutating endpoint in this app.
    // Automated WhatsApp bookings go through the separately-secured
    // webhooks/n8n-booking endpoint instead, so this does not affect that flow.
    const technician = await getTechnicianFromRequest(request);
    if (!technician) {
      return new Response(superjson.stringify({ error: "Not authenticated." }), {
        status: 401,
      });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const ticket = await createTicketRecord(input);

    return new Response(superjson.stringify(ticket satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}