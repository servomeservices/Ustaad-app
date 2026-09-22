import { z } from "zod";
import superjson from "superjson";
import { AuthenticatedTechnician } from "../../helpers/technicianSession";

export const schema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  token: string;
  technician: AuthenticatedTechnician;
};

export const postVerifyOtp = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/verify-otp`, {
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