"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Globe, Lock, Network as NetworkIcon, Plus, RefreshCcw, Shield, Wifi } from "lucide-react"

interface NetworkInterface {
  name: string
  macAddress?: string
  ipv4: string[]
  ipv6: string[]
  up: boolean
}

interface FirewallStatus {
  enabled: boolean
  rawStatus: string
  rules: string[]
}

interface NetworkOverview {
  hostname: string
  defaultGateway?: string
  forwardingEnabled: boolean
  interfaces: NetworkInterface[]
  firewall: FirewallStatus
}

export function Network() {
  const [overview, setOverview] = useState<NetworkOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [ruleInput, setRuleInput] = useState("")
  const [denyInput, setDenyInput] = useState("")
  const [firewallBusy, setFirewallBusy] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    void refreshOverview()
  }, [])

  const refreshOverview = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/network", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as NetworkOverview
      setOverview(data)
    } catch (error) {
      toast({
        title: "Failed to load network info",
        description: error instanceof Error ? error.message : "Unable to fetch network overview",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setFirewallState = async (enable: boolean) => {
    setFirewallBusy(true)
    try {
      const response = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "firewall", state: enable ? "enable" : "disable" }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: `Firewall ${enable ? "enabled" : "disabled"}`,
        description: `UFW has been ${enable ? "activated" : "stopped"}.`,
      })
      await refreshOverview()
    } catch (error) {
      toast({
        title: "Firewall update failed",
        description: error instanceof Error ? error.message : "Unable to update firewall state",
        variant: "destructive",
      })
    } finally {
      setFirewallBusy(false)
    }
  }

  const submitFirewallRule = async (type: "allow" | "deny", value: string) => {
    if (value.trim().length === 0) {
      toast({
        title: "Rule cannot be empty",
        description: "Provide a service name (e.g. ssh) or port (e.g. 443/tcp).",
        variant: "destructive",
      })
      return
    }
    setFirewallBusy(true)
    try {
      const response = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type === "allow" ? "allow-rule" : "deny-rule", rule: value.trim() }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: `Rule ${type === "allow" ? "added" : "blocked"}`,
        description: `${type === "allow" ? "Allowed" : "Denied"} traffic for ${value.trim()}`,
      })
      setRuleInput("")
      setDenyInput("")
      await refreshOverview()
    } catch (error) {
      toast({
        title: "Failed to update firewall",
        description: error instanceof Error ? error.message : "Unable to apply firewall rule",
        variant: "destructive",
      })
    } finally {
      setFirewallBusy(false)
    }
  }

  const reloadFirewall = async () => {
    setFirewallBusy(true)
    try {
      const response = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reload-firewall" }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: "Firewall reloaded",
        description: "UFW rules have been reloaded successfully.",
      })
      await refreshOverview()
    } catch (error) {
      toast({
        title: "Reload failed",
        description: error instanceof Error ? error.message : "Unable to reload firewall",
        variant: "destructive",
      })
    } finally {
      setFirewallBusy(false)
    }
  }

  const interfaces = useMemo(() => overview?.interfaces ?? [], [overview])
  const firewallRules = overview?.firewall.rules ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-balance">Network & Firewall</h1>
        <p className="text-muted-foreground">
          Inspect interface status, forwarding, and manage the Ubuntu UFW firewall.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firewall</CardTitle>
            <Shield className={`h-4 w-4 ${overview?.firewall.enabled ? "text-[var(--mint)]" : "text-yellow-400"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {overview?.firewall.enabled ? "Enabled" : "Disabled"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview?.firewall.enabled ? "Firewall is enforcing rules" : "All firewall rules are inactive"}
                </p>
              </div>
              <Switch
                checked={overview?.firewall.enabled ?? false}
                onCheckedChange={(checked) => void setFirewallState(checked)}
                disabled={firewallBusy}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Gateway</CardTitle>
            <Globe className="h-4 w-4 text-[var(--mint)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.defaultGateway ?? "Not set"}
            </div>
            <p className="text-xs text-muted-foreground">Traffic exits through this gateway</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP Forwarding</CardTitle>
            <NetworkIcon className="h-4 w-4 text-[var(--mint)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.forwardingEnabled ? "Enabled" : "Disabled"}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.forwardingEnabled
                ? "Server is routing packets between interfaces"
                : "Forwarding is turned off"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-[var(--mint)]" />
            Network Interfaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {interfaces.map((iface) => (
              <Card key={iface.name} className="bg-background/40 border-border/40">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{iface.name}</h3>
                    <Badge
                      variant="outline"
                      className={iface.up ? "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30" : ""}
                    >
                      {iface.up ? "UP" : "DOWN"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">MAC: {iface.macAddress ?? "Unknown"}</p>
                  <div className="space-y-1 text-sm">
                    {iface.ipv4.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">IPv4:</span>{" "}
                        {iface.ipv4.join(", ")}
                      </div>
                    )}
                    {iface.ipv6.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">IPv6:</span>{" "}
                        {iface.ipv6.join(", ")}
                      </div>
                    )}
                    {iface.ipv4.length === 0 && iface.ipv6.length === 0 && (
                      <p className="text-muted-foreground text-xs">No addresses assigned.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {interfaces.length === 0 && (
              <p className="text-sm text-muted-foreground">No interfaces detected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--mint)]" />
            Firewall Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="allow-rule">Allow traffic</Label>
              <div className="flex gap-2">
                <Input
                  id="allow-rule"
                  placeholder="e.g. ssh or 443/tcp"
                  value={ruleInput}
                  onChange={(event) => setRuleInput(event.target.value)}
                  disabled={firewallBusy}
                />
                <Button onClick={() => void submitFirewallRule("allow", ruleInput)} disabled={firewallBusy}>
                  <Plus className="h-4 w-4 mr-1" />
                  Allow
                </Button>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="deny-rule">Deny traffic</Label>
              <div className="flex gap-2">
                <Input
                  id="deny-rule"
                  placeholder="e.g. 25/tcp"
                  value={denyInput}
                  onChange={(event) => setDenyInput(event.target.value)}
                  disabled={firewallBusy}
                />
                <Button
                  variant="outline"
                  onClick={() => void submitFirewallRule("deny", denyInput)}
                  disabled={firewallBusy}
                >
                  Block
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Rules correspond to the output of <code className="text-xs">ufw status</code>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => void reloadFirewall()}
              disabled={firewallBusy}
              className="border-border/50 hover:bg-accent/50 bg-transparent"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reload
            </Button>
          </div>

          <div className="space-y-2 max-h-[20rem] overflow-y-auto">
            {firewallRules.map((rule, index) => (
              <Card key={`${rule}-${index}`} className="bg-background/30 border-border/30">
                <CardContent className="py-3 px-4 text-sm">{rule}</CardContent>
              </Card>
            ))}
            {firewallRules.length === 0 && (
              <p className="text-sm text-muted-foreground">No firewall rules have been defined yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => void refreshOverview()} disabled={loading || firewallBusy}>
          Refresh overview
        </Button>
      </div>
    </div>
  )
}
