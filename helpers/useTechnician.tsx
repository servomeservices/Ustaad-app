import { useQuery } from "@tanstack/react-query";
import { getMe } from "../endpoints/technician/me_GET.schema";
import { authHeaders, getStoredToken } from "./authToken";

export function useTechnician() {
  const hasToken = !!getStoredToken();
  return useQuery({
    queryKey: ["technician", "me"],
    queryFn: () => getMe({ headers: authHeaders() }),
    enabled: hasToken,
    retry: false,
  });
}