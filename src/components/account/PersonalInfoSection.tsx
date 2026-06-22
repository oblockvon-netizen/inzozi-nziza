import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { meApi, ApiError } from "@/lib/api";
import {
  normalizeRwandaPhone,
  isValidRwandaPhone,
  RWANDA_PHONE_ERROR,
  RWANDA_PHONE_HINT,
} from "@/lib/phone-validation";
import { Loader2, Save } from "lucide-react";

export function PersonalInfoSection() {
  const { user, setUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  if (!user) return null;

  const validate = (): boolean => {
    let valid = true;
    if (fullName.trim().length < 2) {
      setNameError("Full name must be at least 2 characters");
      valid = false;
    } else {
      setNameError(null);
    }
    if (phone.trim() && !isValidRwandaPhone(phone)) {
      setPhoneError(RWANDA_PHONE_ERROR);
      valid = false;
    } else {
      setPhoneError(null);
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const normalizedPhone = phone.trim() ? normalizeRwandaPhone(phone) : null;
      const { user: updated } = await meApi.updateProfile({
        fullName: fullName.trim(),
        phone: normalizedPhone,
      });
      setUser(updated);
      await refreshUser();
      if (normalizedPhone) setPhone(normalizedPhone);
      toast({ title: "Profile saved", description: "Your information has been updated." });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof ApiError ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Personal information</CardTitle>
        <CardDescription>Update your name and contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="bg-muted/50" />
          <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (nameError) setNameError(null);
            }}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "fullName-error" : undefined}
          />
          {nameError && (
            <p id="fullName-error" className="text-xs text-destructive">
              {nameError}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="+250 788 123 456"
            aria-invalid={!!phoneError}
            aria-describedby="phone-hint"
          />
          <p id="phone-hint" className="text-xs text-muted-foreground">
            {phoneError ?? RWANDA_PHONE_HINT}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-accent hover:bg-accent/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </CardContent>
    </Card>
  );
}
