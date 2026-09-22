import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  presignedUrl: string;
  url: string;
};

export const postShopPhotoUploadUrl = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/shops/photo-upload-url`, {
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