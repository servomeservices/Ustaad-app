import { db } from "./db";
import { Selectable } from "kysely";
import { Tickets, TicketService } from "./schema";

export type CreateTicketInput = {
  service: TicketService;
  serviceDescription?: string;
  customerName: string;
  customerContact: string;
  address: string;
  preferredTime: string;
  createdByShop?: string | null;
};

// Shared by the public tickets/create endpoint (used by the app itself) and
// the n8n booking webhook (used by the WhatsApp bot) so both paths insert a
// ticket the exact same way, instead of one endpoint calling the other.
export async function createTicketRecord(input: CreateTicketInput): Promise<Selectable<Tickets>> {
  return db
    .insertInto("tickets")
    .values({
      service: input.service,
      serviceDescription: input.serviceDescription ?? "",
      customerName: input.customerName,
      customerContact: input.customerContact,
      address: input.address,
      preferredTime: input.preferredTime,
      createdByShop: input.createdByShop ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}