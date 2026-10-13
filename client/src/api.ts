export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
};

export type ListResponse = {
  data: Ticket[];
  page: number;
  limit: number;
  total: number;
};

export type Stats = Record<TicketStatus, number>;

export type ApiErrorDetail = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(status: number, message: string, details: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ListTicketsOptions = {
  status?: TicketStatus;
  page?: number;
  limit?: number;
};

type CreateTicketInput = {
  title: string;
  description?: string;
  priority?: TicketPriority;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      details?: ApiErrorDetail[];
    } | null;
    throw new ApiError(response.status, payload?.error ?? "Request failed", payload?.details ?? []);
  }

  return (await response.json()) as T;
}

export function listTickets(options: ListTicketsOptions = {}, requestOptions?: RequestInit): Promise<ListResponse> {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.page !== undefined) params.set("page", String(options.page));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  const query = params.toString();
  return request<ListResponse>(`/tickets${query ? `?${query}` : ""}`, requestOptions);
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTicket(id: string, changes: { status?: TicketStatus; priority?: TicketPriority }): Promise<Ticket> {
  return request<Ticket>(`/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function getStats(requestOptions?: RequestInit): Promise<Stats> {
  return request<Stats>("/tickets/stats", requestOptions);
}
