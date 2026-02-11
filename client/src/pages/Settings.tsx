import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/lib/use-app-settings";
import { useState, useEffect } from "react";
import type { AppSettings } from "@/lib/app-api";

export default function Settings() {
  const { settings, isLoading, isSaving, saveSettings } = useAppSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    try {
      await saveSettings(localSettings);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (_error) {
      toast({
        title: "Save failed",
        description: "Unable to save settings right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container max-w-2xl py-6 space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your dashboard preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Configure data fetching and display options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="currency">Display Currency</Label>
              <Select
                value={localSettings?.currency}
                onValueChange={(currency: AppSettings["currency"]) =>
                  localSettings && setLocalSettings({ ...localSettings, currency })
                }
                disabled={isLoading || !localSettings}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD - US Dollar</SelectItem>
                  <SelectItem value="eur">EUR - Euro</SelectItem>
                  <SelectItem value="idr">IDR - Indonesian Rupiah</SelectItem>
                  <SelectItem value="jpy">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="interval">Auto-Refresh Interval (Seconds)</Label>
              <Select
                value={localSettings?.refreshInterval}
                onValueChange={(refreshInterval: AppSettings["refreshInterval"]) =>
                  localSettings && setLocalSettings({ ...localSettings, refreshInterval })
                }
                disabled={isLoading || !localSettings}
              >
                <SelectTrigger id="interval">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 Seconds (High CPU)</SelectItem>
                  <SelectItem value="30">30 Seconds (Recommended)</SelectItem>
                  <SelectItem value="60">1 Minute</SelectItem>
                  <SelectItem value="300">5 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="indicators">Show Technical Indicators</Label>
                <p className="text-sm text-muted-foreground">
                  Enable advanced charts (RSI, MACD, BB) in Detail view.
                </p>
              </div>
              <Switch
                id="indicators"
                checked={localSettings?.indicators ?? true}
                onCheckedChange={(indicators) =>
                  localSettings && setLocalSettings({ ...localSettings, indicators })
                }
                disabled={isLoading || !localSettings}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-1">
                <Label htmlFor="notifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get alerted when watchlist items hit price targets.
                </p>
              </div>
              <Switch
                id="notifications"
                checked={localSettings?.notifications ?? true}
                onCheckedChange={(notifications) =>
                  localSettings && setLocalSettings({ ...localSettings, notifications })
                }
                disabled={isLoading || !localSettings}
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={isLoading || isSaving || !localSettings}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
