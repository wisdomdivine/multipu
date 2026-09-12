import "server-only";

import { createAdminSupabase } from "@/lib/supabase/server";

export type AdminAuditEvent = 
  | "admin_login"
  | "admin_logout"
  | "update_launch_controls"
  | "update_protocol_fee"
  | "suspicious_activity";

export async function logAdminAudit(
  walletAddress: string,
  event: AdminAuditEvent,
  payload?: Record<string, unknown>,
  ipAddress?: string
) {
  try {
    const supabase = createAdminSupabase();
    const enrichedPayload = {
      ...payload,
      ...(ipAddress && { ip_address: ipAddress }),
      timestamp: new Date().toISOString(),
    };

    await supabase.from("admin_audit_logs").insert({
      wallet_address: walletAddress,
      action: event,
      payload: enrichedPayload,
    });
  } catch (err) {
    console.error("[Security] Failed to log audit event:", err);
  }
}

export async function getRecentAuditLogs(limit = 50) {
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((log) => ({
      id: log.id,
      wallet_address: log.wallet_address,
      action: log.action,
      payload: log.payload as Record<string, unknown>,
      timestamp: log.created_at,
      ip_address: (log.payload as Record<string, unknown>)?.ip_address as string | undefined,
    }));
  } catch (err) {
    console.error("[Security] Failed to fetch audit logs:", err);
    return [];
  }
}

export function getIpWhitelist(): string[] {
  return (process.env.ADMIN_IP_WHITELIST ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export function isIpWhitelisted(_ip: string): boolean {
  // IP restrictions disabled for now
  return true;
}

export function getSessionTimeout(): number {
  return parseInt(process.env.ADMIN_SESSION_TIMEOUT_MINUTES ?? "480", 10) * 60 * 1000;
}
