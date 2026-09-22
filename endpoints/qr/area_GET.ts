import { OutputType } from "./area_GET.schema";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(superjson.stringify({ error: "Missing area code." }), { status: 400 });
    }

    const area = await db
      .selectFrom("serviceAreas")
      .selectAll()
      .where("areaCode", "=", code)
      .executeTakeFirst();

    if (!area) {
      return new Response(
        superjson.stringify({ error: "This QR code isn't linked to a known area. Ask ops for a valid stand." }),
        { status: 404 },
      );
    }

    return new Response(superjson.stringify(area satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}