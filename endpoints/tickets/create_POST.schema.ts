import { z } from "zod";
import superjson from "superjson";
import { TicketServiceArrayValues } from "../../helpers/schema";
import { Selectable } from "kysely";
import { Tickets } from "../../helpers/schema";

export const schema = z.object({
  service: z.enum(TicketServiceArrayValues),
  serviceDescription: z.string().optional(),
  customerName: z.string().min(1),
  customerContact: z.string().min(6),
  address: z.string().min(1),
  preferredTime: z.string().min(1),
  createdByShop: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Tickets>;

export const postCreateTicket = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/tickets/create`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};