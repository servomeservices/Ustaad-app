import superjson from "superjson";
import { Selectable } from "kysely";
import { Tickets } from "../../helpers/schema";

export type OutputType = Selectable<Tickets>[];

export const getAvailableTickets = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/tickets/available`, {
    method: "GET",
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