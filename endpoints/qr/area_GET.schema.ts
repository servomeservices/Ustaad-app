import superjson from "superjson";
import { Selectable } from "kysely";
import { ServiceAreas } from "../../helpers/schema";

export type OutputType = Selectable<ServiceAreas>;

export const getQrArea = async (
  query: { code: string },
  init?: RequestInit,
): Promise<OutputType> => {
  const params = new URLSearchParams({ code: query.code });
  const result = await fetch(`/_api/qr/area?${params.toString()}`, {
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