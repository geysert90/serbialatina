"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HistoryEntry = {
  title: string;
  body: string;
  url: string;
  tag: string;
  delivered: number;
  removed: number;
  sentAt: string;
  source?: "admin" | "scan";
};

type Stats = {
  subscriberCount: number;
  subscribers: Array<{
    endpoint: string;
    createdAt: string;
    updatedAt: string;
    userAgent: string | null;
  }>;
  history: HistoryEntry[];
};

type SendResult = {
  ok: boolean;
  delivered: number;
  removed: number;
  errors?: Array<{ endpoint: string; error: string }>;
};

type ScanResult = {
  ok: boolean;
  scanned: number;
  matched: number;
  notified: number;
  delivered: number;
  removed: number;
};

export default function AdminPushPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [title, setTitle] = useState("Serbia Latina");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"success" | "error" | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/push/admin/stats", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/acceso");
          return;
        }
        throw new Error(`Error ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  const [noAdmin, setNoAdmin] = useState(false);

  useEffect(() => {
    // First check if user is logged in via session API
    fetch("/api/push/admin/check-auth", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.push("/acceso");
          return;
        }
        if (res.status === 403) {
          setNoAdmin(true);
          setAuthChecking(false);
          return;
        }
        setAuthChecking(false);
        fetchStats();
      })
      .catch(() => {
        setAuthChecking(false);
        fetchStats();
      });
  }, [fetchStats, router]);

  const handleSend = useCallback(async () => {
    if (!body.trim()) return;
    setSending(true);
    setResult(null);
    setResultType(null);

    try {
      const res = await fetch("/api/push/admin/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() }),
      });
      const data: SendResult & { error?: string } = await res.json();
      if (data.ok) {
        setResult(`✅ Enviado a ${data.delivered} dispositivos${data.removed > 0 ? ` (${data.removed} suscripciones obsoletas eliminadas)` : ""}`);
        setResultType("success");
        setBody("");
        fetchStats();
      } else {
        setResult(`❌ ${data.error || "Error al enviar"}`);
        setResultType("error");
      }
    } catch {
      setResult("❌ Error de conexión");
      setResultType("error");
    } finally {
      setSending(false);
    }
  }, [title, body, url, fetchStats]);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setResult(null);
    setResultType(null);

    try {
      const res = await fetch("/api/push/admin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data: ScanResult & { error?: string } = await res.json();
      if (data.ok) {
        setResult(
          `🔍 Escaneados ${data.scanned} posts. ` +
          `${data.notified > 0 ? `✅ ${data.notified} notificaciones enviadas` : "📭 Sin novedades"}` +
          ` (${data.delivered} entregas, ${data.removed} eliminadas)`,
        );
        setResultType("success");
        fetchStats();
      } else {
        setResult(`❌ ${data.error || "Error al escanear"}`);
        setResultType("error");
      }
    } catch {
      setResult("❌ Error de conexión");
      setResultType("error");
    } finally {
      setScanning(false);
    }
  }, [fetchStats]);

  if (authChecking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-black/50">Verificando acceso…</p>
      </div>
    );
  }

  if (noAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500">
          ⛔
        </div>
        <h2 className="text-lg font-semibold">Acceso restringido</h2>
        <p className="mt-2 text-sm text-black/50">
          Solo los administradores pueden gestionar las notificaciones push.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-black/5 px-5 py-2.5 text-sm font-medium transition hover:bg-black/10"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Push Notifications</h1>
        <p className="mt-1 text-sm text-black/50">
          Administra el envío de notificaciones a los suscriptores PWA
        </p>
      </div>

      {/* Subscriber count */}
      <div className="mb-8 rounded-3xl border border-black/8 bg-white/70 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">
            {loading ? "…" : stats?.subscriberCount ?? 0}
          </div>
          <div>
            <p className="font-semibold">Suscriptores activos</p>
            <p className="text-sm text-black/50">
              Dispositivos que recibirán las notificaciones push
            </p>
          </div>
        </div>
        {stats && !loading && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-black/40 hover:text-black/70">
              Ver detalles de suscripciones
            </summary>
            <ul className="mt-2 space-y-2">
              {stats.subscribers.map((s, i) => (
                <li key={i} className="rounded-xl border border-black/5 bg-white/40 px-3 py-2 text-xs text-black/60">
                  <div className="flex items-center gap-2">
                    <span>{s.endpoint}</span>
                    <span className="text-[10px] text-black/30">{s.userAgent || "—"}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-black/35">
                    Desde {new Date(s.createdAt).toLocaleDateString("es")}
                  </div>
                </li>
              ))}
            </ul>
        </details>
        )}
      </div>

      {/* Send form */}
      <div className="mb-6 rounded-3xl border border-black/8 bg-white/70 p-5">
        <h2 className="mb-4 font-semibold">Enviar notificación</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-black/50">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/50">Mensaje</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Escribe el texto de la notificación…"
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-black/50">Enlace (opcional)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Enviando…" : "📨 Enviar notificación"}
          </button>
        </div>
      </div>

      {/* Scan button */}
      <div className="mb-6 rounded-3xl border border-black/8 bg-white/70 p-5">
        <h2 className="mb-1 font-semibold">Escanear WordPress</h2>
        <p className="mb-4 text-sm text-black/50">
          Busca nuevos posts publicados en WordPress y envía notificaciones automáticas
        </p>
        <button
          type="button"
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scanning ? "Escaneando…" : "🔍 Escanear y notificar"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
            resultType === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {result}
        </div>
      )}

      {/* History */}
      {stats && stats.history.length > 0 && (
        <div className="rounded-3xl border border-black/8 bg-white/70 p-5">
          <h2 className="mb-4 font-semibold">Últimos envíos</h2>
          <div className="space-y-2">
            {stats.history.slice(0, 10).map((entry, i) => (
              <div key={i} className="rounded-xl border border-black/5 bg-white/40 px-3.5 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{entry.body}</span>
                  <span className="ml-2 shrink-0 text-xs text-black/40">
                    {new Date(entry.sentAt).toLocaleString("es")}
                  </span>
                </div>
                <div className="mt-0.5 flex gap-3 text-[11px] text-black/40">
                  <span>📨 {entry.delivered} entregas</span>
                  {entry.removed > 0 && <span>🗑️ {entry.removed} obsoletas</span>}
                  {entry.source && (
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px]">
                      {entry.source === "scan" ? "automático" : "manual"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
