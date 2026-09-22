import { schema, OutputType } from "./photo-upload-url_POST.schema";
import { upload } from "@floot/storage";
import { nanoid } from "nanoid";
import superjson from "superjson";

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const extension = EXTENSION_BY_CONTENT_TYPE[input.contentType.toLowerCase()];
    if (!extension) {
      return new Response(
        superjson.stringify({ error: "Unsupported photo type. Please use JPEG, PNG or WEBP." }),
        { status: 400 },
      );
    }

    const filename = `shop-photos/${nanoid(24)}.${extension}`;
    const result = await upload({
      visibility: "public",
      filename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });

    if (!result.ok) {
      return new Response(
        superjson.stringify({ error: result.error.message }),
        { status: 400 },
      );
    }

    return new Response(
      superjson.stringify({
        presignedUrl: result.presignedUrl,
        url: result.url,
      } satisfies OutputType),
    );
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}