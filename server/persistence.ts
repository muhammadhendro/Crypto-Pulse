import { Pool } from "pg";
import { randomUUID } from "crypto";

export type Settings = {
  refreshInterval: "10" | "30" | "60" | "300";
  currency: "usd" | "eur" | "idr" | "jpy";
  notifications: boolean;
  indicators: boolean;
};

export type Trade = {
  id: string;
  date: string;
  pair: string;
  type: "Long" | "Short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  notes: string;
  setupTag: string;
  mistakeTag: string;
  mood: "Calm" | "Neutral" | "FOMO" | "Fear";
  status: "Open" | "Closed";
};

export type AlertRule = {
  id: string;
  coinId: string;
  coinSymbol: string;
  type: "price_above" | "price_below" | "rsi_above" | "rsi_below" | "macd_bullish" | "macd_bearish";
  threshold: number | null;
  enabled: boolean;
  createdAt: string;
  triggeredAt: string | null;
};

type AppStateRow = {
  settings: Settings | null;
  watchlist: string[] | null;
  journal: Trade[] | null;
  alerts: AlertRule[] | null;
  auth_username: string | null;
};

const defaultSettings: Settings = {
  refreshInterval: "30",
  currency: "usd",
  notifications: true,
  indicators: true,
};

const hasDb = Boolean(process.env.DATABASE_URL);
const pool = hasDb ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
let initialized = false;

const memState = new Map<string, AppStateRow>();
const memUsers = new Map<string, { id: string; username: string; password: string }>();

async function ensureDb() {
  if (!pool || initialized) return;
  await pool.query(`
    create table if not exists app_state (
      client_id text primary key,
      settings jsonb,
      watchlist jsonb,
      journal jsonb,
      alerts jsonb,
      auth_username text,
      updated_at timestamptz default now()
    );
  `);

  await pool.query(`
    create table if not exists users (
      id text primary key,
      username text unique not null,
      password text not null
    );
  `);

  initialized = true;
}

function getMemState(clientId: string): AppStateRow {
  const row = memState.get(clientId);
  if (row) return row;
  const created: AppStateRow = {
    settings: { ...defaultSettings },
    watchlist: [],
    journal: [],
    alerts: [],
    auth_username: null,
  };
  memState.set(clientId, created);
  return created;
}

async function getDbState(clientId: string): Promise<AppStateRow> {
  await ensureDb();
  if (!pool) return getMemState(clientId);

  const result = await pool.query(
    `select settings, watchlist, journal, alerts, auth_username from app_state where client_id = $1`,
    [clientId]
  );

  if (result.rowCount === 0) {
    const row: AppStateRow = {
      settings: { ...defaultSettings },
      watchlist: [],
      journal: [],
      alerts: [],
      auth_username: null,
    };

    await pool.query(
      `insert into app_state (client_id, settings, watchlist, journal, alerts, auth_username)
       values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6)`,
      [clientId, JSON.stringify(row.settings), JSON.stringify(row.watchlist), JSON.stringify(row.journal), JSON.stringify(row.alerts), row.auth_username]
    );

    return row;
  }

  return result.rows[0] as AppStateRow;
}

async function updateDbField(clientId: string, field: keyof AppStateRow, value: unknown) {
  await ensureDb();
  if (!pool) return;

  const isJsonField = field !== "auth_username";
  const query = isJsonField
    ? `update app_state set ${field} = $2::jsonb, updated_at = now() where client_id = $1`
    : `update app_state set ${field} = $2, updated_at = now() where client_id = $1`;

  await pool.query(query, [clientId, isJsonField ? JSON.stringify(value) : value]);
}

export async function getSettings(clientId: string): Promise<Settings> {
  if (!hasDb) return (getMemState(clientId).settings ?? defaultSettings);
  const state = await getDbState(clientId);
  return (state.settings ?? defaultSettings) as Settings;
}

export async function setSettings(clientId: string, settings: Settings) {
  if (!hasDb) {
    getMemState(clientId).settings = settings;
    return settings;
  }
  await getDbState(clientId);
  await updateDbField(clientId, "settings", settings);
  return settings;
}

export async function getWatchlist(clientId: string): Promise<string[]> {
  if (!hasDb) return getMemState(clientId).watchlist ?? [];
  const state = await getDbState(clientId);
  return (state.watchlist ?? []) as string[];
}

export async function setWatchlist(clientId: string, watchlist: string[]) {
  const unique = Array.from(new Set(watchlist));
  if (!hasDb) {
    getMemState(clientId).watchlist = unique;
    return unique;
  }
  await getDbState(clientId);
  await updateDbField(clientId, "watchlist", unique);
  return unique;
}

export async function getJournal(clientId: string): Promise<Trade[]> {
  if (!hasDb) return getMemState(clientId).journal ?? [];
  const state = await getDbState(clientId);
  return (state.journal ?? []) as Trade[];
}

export async function addJournalTrade(clientId: string, trade: Omit<Trade, "id" | "date">): Promise<Trade> {
  const created: Trade = { ...trade, id: randomUUID(), date: new Date().toISOString() };

  if (!hasDb) {
    const state = getMemState(clientId);
    state.journal = [created, ...(state.journal ?? [])];
    return created;
  }

  const current = await getJournal(clientId);
  const next = [created, ...current];
  await updateDbField(clientId, "journal", next);
  return created;
}

export async function deleteJournalTrade(clientId: string, tradeId: string) {
  const current = await getJournal(clientId);
  const next = current.filter((trade) => trade.id !== tradeId);

  if (!hasDb) {
    getMemState(clientId).journal = next;
    return;
  }

  await updateDbField(clientId, "journal", next);
}

export async function getAlerts(clientId: string): Promise<AlertRule[]> {
  if (!hasDb) return getMemState(clientId).alerts ?? [];
  const state = await getDbState(clientId);
  return (state.alerts ?? []) as AlertRule[];
}

export async function addAlert(clientId: string, payload: Omit<AlertRule, "id" | "createdAt" | "triggeredAt">): Promise<AlertRule> {
  const rule: AlertRule = {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    triggeredAt: null,
  };

  const current = await getAlerts(clientId);
  const next = [rule, ...current];

  if (!hasDb) {
    getMemState(clientId).alerts = next;
    return rule;
  }

  await updateDbField(clientId, "alerts", next);
  return rule;
}

export async function updateAlerts(clientId: string, updater: (alerts: AlertRule[]) => AlertRule[]) {
  const current = await getAlerts(clientId);
  const next = updater(current);

  if (!hasDb) {
    getMemState(clientId).alerts = next;
    return next;
  }

  await updateDbField(clientId, "alerts", next);
  return next;
}

export async function setAuthUsername(clientId: string, username: string | null) {
  if (!hasDb) {
    getMemState(clientId).auth_username = username;
    return;
  }
  await getDbState(clientId);
  await updateDbField(clientId, "auth_username", username);
}

export async function getAuthUsername(clientId: string) {
  if (!hasDb) return getMemState(clientId).auth_username;
  const state = await getDbState(clientId);
  return state.auth_username;
}

export async function createUser(username: string, password: string) {
  if (!hasDb) {
    const existing = Array.from(memUsers.values()).find((user) => user.username === username);
    if (existing) return null;
    const user = { id: randomUUID(), username, password };
    memUsers.set(user.id, user);
    return user;
  }

  await ensureDb();
  if (!pool) return null;

  const exists = await pool.query(`select id from users where username = $1`, [username]);
  if (exists.rowCount) return null;

  const user = { id: randomUUID(), username, password };
  await pool.query(`insert into users (id, username, password) values ($1, $2, $3)`, [user.id, user.username, user.password]);
  return user;
}

export async function getUserByUsername(username: string) {
  if (!hasDb) {
    return Array.from(memUsers.values()).find((user) => user.username === username) ?? null;
  }

  await ensureDb();
  if (!pool) return null;

  const result = await pool.query(`select id, username, password from users where username = $1`, [username]);
  return (result.rows[0] as { id: string; username: string; password: string } | undefined) ?? null;
}
