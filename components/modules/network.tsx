"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { NetworkIcon, Wifi, Shield, Globe, Server, Lock } from "lucide-react"

interface NetworkConnection {
  id: number
  ip: string
  port: number
  protocol: string
  status: "active" | "blocked"
  location: string
}

interface FirewallRule {
  id: number
  name: string
  port: string
  protocol: string
  action: "allow" | "deny"
  enabled: boolean
}

const connections: NetworkConnection[] = [
  { id: 1, ip: "192.168.1.100", port: 22, protocol: "SSH", status: "active", location: "Internal" },
  { id: 2, ip: "203.0.113.45", port: 80, protocol: "HTTP", status: "active", location: "External" },
  { id: 3, ip: "198.51.100.23", port: 443, protocol: "HTTPS", status: "active", location: "External" },
  { id: 4, ip: "10.0.0.50", port: 5432, protocol: "PostgreSQL", status: "active", location: "Internal" },
  { id: 5, ip: "172.16.0.10", port: 6379, protocol: "Redis", status: "blocked", location: "Internal" },
]

const firewallRules: FirewallRule[] = [
  { id: 1, name: "SSH Access", port: "22", protocol: "TCP", action: "allow", enabled: true },
  { id: 2, name: "HTTP Traffic", port: "80", protocol: "TCP", action: "allow", enabled: true },
  { id: 3, name: "HTTPS Traffic", port: "443", protocol: "TCP", action: "allow", enabled: true },
  { id: 4, name: "Database Access", port: "5432", protocol: "TCP", action: "allow", enabled: true },
  { id: 5, name: "Block Suspicious", port: "1337", protocol: "TCP", action: "deny", enabled: true },
]

export function Network() {
  const [rules, setRules] = useState(firewallRules)

  const toggleRule = (id: number) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30"
      : "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getActionColor = (action: string) => {
    return action === "allow"
      ? "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30"
      : "bg-red-500/20 text-red-400 border-red-500/30"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Network Management</h1>
        <p className="text-muted-foreground">Monitor connections and manage firewall rules</p>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <NetworkIcon className="h-4 w-4 text-[var(--mint)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--mint)]">
              {connections.filter((c) => c.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently connected</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Shield className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {connections.filter((c) => c.status === "blocked").length}
            </div>
            <p className="text-xs text-muted-foreground">Security blocks</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Ports</CardTitle>
            <Globe className="h-4 w-4 text-[var(--emerald)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--emerald)]">
              {rules.filter((r) => r.action === "allow" && r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">Accessible services</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Firewall Rules</CardTitle>
            <Lock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{rules.filter((r) => r.enabled).length}</div>
            <p className="text-xs text-muted-foreground">Active rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Connections */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-[var(--mint)]" />
            Active Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-[var(--mint)]/10">
                    <Server className="h-4 w-4 text-[var(--mint)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{connection.ip}</span>
                      <Badge variant="outline" className="text-xs">
                        Port {connection.port}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {connection.protocol}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(connection.status)}>
                        {connection.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{connection.location} connection</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      connection.status === "blocked"
                        ? "border-[var(--mint)]/30 hover:bg-[var(--mint)]/10 text-[var(--mint)]"
                        : "border-red-500/30 hover:bg-red-500/10 text-red-400"
                    }
                  >
                    {connection.status === "blocked" ? "Unblock" : "Block"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Firewall Rules */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--mint)]" />
            Firewall Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-[var(--mint)]/10">
                    <Lock className="h-4 w-4 text-[var(--mint)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Port {rule.port}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rule.protocol}
                      </Badge>
                      <Badge variant="outline" className={getActionColor(rule.action)}>
                        {rule.action.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.enabled ? "Rule is active" : "Rule is disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{rule.enabled ? "Enabled" : "Disabled"}</span>
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  </div>
                  <Button variant="outline" size="sm" className="border-border/50 hover:bg-accent/50 bg-transparent">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
