import { schema, OutputType } from "./register_POST.schema";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const area = await db
      .selectFrom("serviceAreas")
      .selectAll()
      .where("areaCode", "=", input.areaCode)
      .executeTakeFirst();

    if (!area) {
      return new Response(
        superjson.stringify({ error: "This QR code isn't linked to a known area. Ask ops for a valid stand." }),
        { status: 404 },
      );
    }

    const shop = await db
      .insertInto("shops")
      .values({
        areaCode: area.areaCode,
        locality: area.locality,
        localityName: area.localityName,
        subLocality: area.subLocality,
        subLocalityName: area.subLocalityName,
        shopName: input.shopName,
        ownerContact: input.ownerContact,
        photoUrl: input.photoUrl,
        latitude: input.latitude,
        longitude: input.longitude,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(shop satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}