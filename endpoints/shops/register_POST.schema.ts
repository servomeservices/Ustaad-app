import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Shops } from "../../helpers/schema";

export const schema = z.object({
  areaCode: z.string().min(1),
  shopName: z.string().min(1),
  ownerContact: z.string().min(6),
  photoUrl: z.string().min(1),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = Selectable<Shops>;

export const postRegisterShop = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/shops/register`, {
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