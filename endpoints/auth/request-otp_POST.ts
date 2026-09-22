import { schema, OutputType } from "./request-otp_POST.schema";
import { db } from "../../helpers/db";
import { normalizePhone } from "../../helpers/technicianSession";
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

    // Rate limit OTP sends per phone number so the flow can't be spammed:
    // a short cooldown between individual requests, plus a daily cap.
    const OTP_COOLDOWN_MS = 60 * 1000;
    const OTP_DAILY_CAP = 5;
    const dailyWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentCodes = await db
      .selectFrom("otpCodes")
      .select(["createdAt"])
      .where("phone", "=", phone)
      .where("createdAt", ">", dailyWindowStart)
      .orderBy("createdAt", "desc")
      .execute();

    if (recentCodes.length > 0) {
      const msSinceLast = Date.now() - new Date(recentCodes[0].createdAt).getTime();
      if (msSinceLast < OTP_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - msSinceLast) / 1000);
        return new Response(
          superjson.stringify({
            error: `Please wait ${waitSeconds}s before requesting another code.`,
          }),
          { status: 429 },
        );
      }
    }

    if (recentCodes.length >= OTP_DAILY_CAP) {
      return new Response(
        superjson.stringify({
          error: "Too many code requests for this number today. Please try again tomorrow.",
        }),
        { status: 429 },
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db
      .insertInto("otpCodes")
      .values({ phone, code, expiresAt })
      .execute();

    // No SMS provider is connected yet, so the code is returned directly for
    // development/testing. Once an SMS provider (e.g. Exotel) is connected,
    // send `code` via SMS here instead and stop returning devHint.
    return new Response(
      superjson.stringify({
        message: `Code sent to ${phone}.`,
        devHint: code,
      } satisfies OutputType),
    );
  } catch (error) {
    return new Response(
      superjson.stringify({ error: (error as Error).message }),
      { status: 400 },
    );
  }
}