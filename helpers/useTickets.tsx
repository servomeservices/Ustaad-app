import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAvailableTickets } from "../endpoints/tickets/available_GET.schema";
import { getMyTicket } from "../endpoints/tickets/mine_GET.schema";
import { postAcceptTicket } from "../endpoints/tickets/accept_POST.schema";
import { postAdvanceTicket } from "../endpoints/tickets/advance_POST.schema";
import { authHeaders, getStoredToken } from "./authToken";

export function useAvailableTickets() {
  return useQuery({
    queryKey: ["tickets", "available"],
    queryFn: () => getAvailableTickets({ headers: authHeaders() }),
    enabled: !!getStoredToken(),
    refetchInterval: 10000,
  });
}

export function useMyTicket() {
  return useQuery({
    queryKey: ["tickets", "mine"],
    queryFn: () => getMyTicket({ headers: authHeaders() }),
    enabled: !!getStoredToken(),
    refetchInterval: 10000,
  });
}

export function useAcceptTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      postAcceptTicket({ ticketId }, { headers: authHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "available"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["technician", "me"] });
    },
  });
}

export function useAdvanceTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      postAdvanceTicket({ ticketId }, { headers: authHeaders() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "mine"] });
    },
  });
}