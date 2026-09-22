import { OutputType } from "./me_GET.schema";
import { getTechnicianFromRequest } from "../../helpers/technicianSession";
import superjson from "superjson";

export async function handle(request: Request) {
  const technician = await getTechnicianFromRequest(request);
  if (!technician) {
    return new Response(superjson.stringify({ error: "Not authenticated." }), {
      status: 401,
    });
  }
  return new Response(superjson.stringify(technician satisfies OutputType));
}