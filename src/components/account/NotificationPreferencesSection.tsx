import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences";
import { Bell } from "lucide-react";

const toggles: { key: keyof NotificationPreferences; label: string; desc: string }[] = [
  { key: "contributions", label: "Contributions", desc: "Payment recorded, monthly reminders" },
  { key: "loans", label: "Loans", desc: "Applications, approvals, and repayments" },
  { key: "fines", label: "Fines", desc: "Issued fines and payment confirmations" },
  { key: "membership", label: "Membership", desc: "Approval status and account updates" },
  { key: "system", label: "System", desc: "Platform announcements" },
  { key: "emailDigest", label: "Email digest", desc: "Weekly summary (coming soon)" },
];

export function NotificationPreferencesSection() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences>(loadNotificationPreferences);

  const toggle = (key: keyof NotificationPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    saveNotificationPreferences(next);
    toast({ title: "Preferences saved" });
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold" />
          Notification preferences
        </CardTitle>
        <CardDescription>Choose which updates you want to see in your inbox</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toggles.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3"
          >
            <div>
              <Label className="text-sm font-medium">{item.label}</Label>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[item.key]}
              onClick={() => toggle(item.key)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                prefs[item.key] ? "bg-accent" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[item.key] ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
