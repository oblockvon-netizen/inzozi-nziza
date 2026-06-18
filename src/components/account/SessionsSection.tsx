import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ux/EmptyState";
import { ErrorState } from "@/components/ux/ErrorState";
import { useToast } from "@/hooks/use-toast";
import { meApi, ApiError } from "@/lib/api";
import { parseUserAgent } from "@/lib/notification-utils";
import type { UserSession } from "@/types/api";
import { Loader2, Monitor, Trash2 } from "lucide-react";

export function SessionsSection() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoadError(null);
      const { sessions: data } = await meApi.sessions();
      setSessions(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Try again";
      setLoadError(message);
      toast({
        title: "Failed to load sessions",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await meApi.revokeSession(id);
      toast({ title: "Session revoked" });
      await loadSessions();
    } catch (error) {
      toast({
        title: "Revoke failed",
        description: error instanceof ApiError ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  const revokeOthers = async () => {
    setRevoking("others");
    try {
      const { count } = await meApi.revokeOtherSessions();
      toast({ title: "Other sessions revoked", description: `${count} session(s) ended.` });
      await loadSessions();
    } catch (error) {
      toast({
        title: "Revoke failed",
        description: error instanceof ApiError ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-accent" aria-hidden="true" />
            Active sessions
          </CardTitle>
          <CardDescription>Devices where you&apos;re signed in</CardDescription>
        </div>
        {sessions.filter((s) => !s.current).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={revokeOthers}
            disabled={revoking === "others"}
            className="gap-1"
          >
            {revoking === "others" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Revoke all others
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading sessions">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : loadError && sessions.length === 0 ? (
          <ErrorState message={loadError} onRetry={loadSessions} compact />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="No active sessions"
            description="Signed-in devices will appear here"
            compact
          />
        ) : (
          <ul className="space-y-3" aria-label="Active sessions">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{parseUserAgent(session.userAgent)}</p>
                    {session.current && (
                      <Badge className="bg-accent/15 text-accent hover:bg-accent/15">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.ipAddress ?? "Unknown IP"} · Active{" "}
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revoke(session.id)}
                    disabled={revoking === session.id}
                    aria-label={`Revoke session on ${parseUserAgent(session.userAgent)}`}
                  >
                    {revoking === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Revoke"
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
