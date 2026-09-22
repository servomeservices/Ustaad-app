import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/Tabs";
import { useTechnician } from "../helpers/useTechnician";
import {
  useAvailableTickets,
  useMyTicket,
  useAcceptTicket,
  useAdvanceTicket,
} from "../helpers/useTickets";
import { clearStoredToken, getStoredToken } from "../helpers/authToken";
import { Selectable } from "kysely";
import { Tickets, TicketStatus } from "../helpers/schema";
import styles from "./_index.module.css";

function statusVariant(status: TicketStatus): "primary" | "warning" | "success" {
  if (status === "Completed") return "success";
  if (status === "InProgress" || status === "Arrived") return "warning";
  return "primary";
}

function TicketCard({
  ticket,
  actionLabel,
  onAction,
  busy,
}: {
  ticket: Selectable<Tickets>;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.service}>{ticket.service}</div>
          <div className={styles.customer}>{ticket.customerName}</div>
        </div>
        <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Address</span>
        <span className={styles.metaValue}>{ticket.address}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Time</span>
        <span className={styles.metaValue}>{ticket.preferredTime}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Booking fee</span>
        <span className={styles.metaValueNum}>₹{ticket.bookingFee}</span>
      </div>
      {actionLabel ? (
        <Button className={styles.cardAction} onClick={onAction} disabled={busy}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

const NEXT_ACTION_LABEL: Record<TicketStatus, string | undefined> = {
  Assigned: undefined,
  Accepted: "Mark arrived",
  Arrived: "Start job",
  InProgress: "Complete job",
  Completed: undefined,
};

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { data: technician, isFetching: isFetchingTechnician, isError } = useTechnician();
  const { data: availableTickets, isFetching: isFetchingLeads } = useAvailableTickets();
  const { data: myTicket, isFetching: isFetchingMine } = useMyTicket();
  const acceptTicket = useAcceptTicket();
  const advanceTicket = useAdvanceTicket();
  const [tab, setTab] = useState("leads");
  const [actionError, setActionError] = useState<string | null>(null);

  const logout = () => {
    clearStoredToken();
    navigate("/login");
  };

  const acceptLead = (id: string) => {
    setActionError(null);
    acceptTicket.mutate(id, {
      onSuccess: () => setTab("active"),
      onError: (e) => setActionError(e instanceof Error ? e.message : "Could not accept lead."),
    });
  };

  const advanceMyTicket = () => {
    if (!myTicket) return;
    setActionError(null);
    advanceTicket.mutate(myTicket.id, {
      onError: (e) => setActionError(e instanceof Error ? e.message : "Could not update job."),
    });
  };

  if (!getStoredToken()) {
    navigate("/login");
    return null;
  }

  if (isError) {
    navigate("/login");
    return null;
  }

  if (isFetchingTechnician && !technician) {
    return (
      <div className={styles.page}>
        <Skeleton style={{ height: 60, marginBottom: 16 }} />
        <Skeleton style={{ height: 90, marginBottom: 16 }} />
        <Skeleton style={{ height: 200 }} />
      </div>
    );
  }

  if (!technician) {
    return null;
  }

  const leads = availableTickets ?? [];

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Servome — Technician Dashboard</title>
      </Helmet>

      <header className={styles.header}>
        <div>
          <div className={styles.appName}>Servome</div>
          <div className={styles.techName}>{technician.name || technician.phone}</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusPill}>
            <span
              className={`${styles.statusDot} ${
                technician.online ? styles.statusDotOnline : styles.statusDotOffline
              }`}
            />
            {technician.online ? "Online" : "Offline"}
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Leads remaining</div>
          <div className={styles.statValue}>{technician.leadsRemaining}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Wallet balance</div>
          <div className={styles.statValue}>
            ₹{(technician.walletPaise / 100).toFixed(0)}
          </div>
        </div>
      </div>

      {actionError ? <div className={styles.actionError}>{actionError}</div> : null}

      <Tabs value={tab} onValueChange={setTab} className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="leads">
            New leads{leads.length > 0 ? ` (${leads.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="active">Active job</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className={styles.tabContent}>
          {isFetchingLeads && leads.length === 0 ? (
            <Skeleton style={{ height: 160 }} />
          ) : leads.length === 0 ? (
            <div className={styles.emptyState}>No new leads right now.</div>
          ) : (
            <div className={styles.cardList}>
              {leads.map((lead) => (
                <TicketCard
                  key={lead.id}
                  ticket={lead}
                  actionLabel="Accept · uses 1 lead"
                  onAction={() => acceptLead(lead.id)}
                  busy={acceptTicket.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className={styles.tabContent}>
          {isFetchingMine && !myTicket ? (
            <Skeleton style={{ height: 160 }} />
          ) : myTicket ? (
            <TicketCard
              ticket={myTicket}
              actionLabel={NEXT_ACTION_LABEL[myTicket.status]}
              onAction={advanceMyTicket}
              busy={advanceTicket.isPending}
            />
          ) : (
            <div className={styles.emptyState}>No active job. Accept a lead to get started.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}