import { z } from "zod";
import { Selectable } from "kysely";
import { Tickets, TicketServiceArrayValues } from "../../helpers/schema";

// NOTE: unlike the app's own endpoints, this one is consumed by n8n, an
// external system that sends plain JSON -- not superjson. Do not use
// superjson.stringify/parse anywhere in this endpoint or its handler.
export const schema = z.object({
  service: z.enum(TicketServiceArrayValues),
  serviceDescription: z.string().optional(),
  customerName: z.string().min(1),
  customerContact: z.string().min(6),
  address: z.string().min(1),
  preferredTime: z.string().min(1),
});

export type InputType = z.infer<typeof schema>;
export type OutputType =
  | { ok: true; ticket: Selectable<Tickets> }
  | { ok: false; error: string };