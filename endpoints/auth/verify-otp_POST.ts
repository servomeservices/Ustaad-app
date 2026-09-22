import { schema, OutputType } from "./verify-otp_POST.schema";
import { db } from "../../helpers/db";
import { normalizePhone } from "../../helpers/technicianSession";
import { nanoid } from "nanoid";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const phone = normalizePhone(input.phone);
    if (!phone) {
      return new Response(
        superjson.stringify({ error: "Enter a valid 10-digit phone number." }),
        { status: 400 },
      );
    }

    const otpRow = await db
      .selectFrom("otpCodes")
      .selectAll()
      .where("phone", "=", phone)
      .where("code", "=", input.code)
      .where("consumedAt", "is", null)
      .where("expiresAt", ">", new Date())
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

    if (!otpRow) {
      return new Response(
        superjson.stringify({ error: "Invalid or expired code." }),
        { status: 400 },
      );
    }

    await db
      .updateTable("otpCodes")
      .set({ consumedAt: new Date() })
      .where("id", "=", otpRow.id)
      .execute();

    let technician = await db
      .selectFrom("technicians")
      .selectAll()
      .where("phone", "=", phone)
      .executeTakeFirst();

    if (!technician) {
      technician = await db
        .insertInto("technicians")
        .values({ phone, name: "" })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    const token = nanoid(48);
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db
      .insertInto("technicianSessions")
      .values({ technicianId: technician.id, token, expiresAt: sessionExpiresAt })
      .execute();

    return new Response(
      superjson.stringify({
        token,
        technician: {
          id: technician.id,
          phone: technician.phone,
          name: technician.name,
          online: technician.online,
          walletPaise: technician.walletPaise,
          leadsRemaining: technician.leadsRemaining,
        },
      } satisfies OutputType),
    );
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}