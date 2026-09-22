import superjson from "superjson";
import { AuthenticatedTechnician } from "../../helpers/technicianSession";

export type OutputType = AuthenticatedTechnician;

export const getMe = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/technician/me`, {
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