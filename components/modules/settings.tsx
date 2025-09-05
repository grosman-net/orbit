"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SettingsIcon, Save, RefreshCw, Bell, Shield, Database, Mail } from "lucide-react"

interface SettingsConfig {
  serverName: string
  adminEmail: string
  timezone: string
  autoBackup: boolean
  backupInterval: string
  alertsEnabled: boolean
  emailNotifications: boolean
  securityLevel: string
  logRetention: string
  maintenanceMode: boolean
}

export function Settings() {
  const [config, setConfig] = useState<SettingsConfig>({
    serverName: "Orbit Production Server",
    adminEmail: "admin@orbit.local",
    timezone: "UTC",
    autoBackup: true,
    backupInterval: "daily",
    alertsEnabled: true,
    emailNotifications: true,
    securityLevel: "high",
    logRetention: "30",
    maintenanceMode: false,
  })

  const [saving, setSaving] = useState(false)

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      localStorage.setItem("orbit-settings", JSON.stringify(config))
      setSaving(false)
    }, 1000)
  }

  const handleReset = () => {
    const defaultConfig: SettingsConfig = {
      serverName: "Orbit Production Server",
      adminEmail: "admin@orbit.local",
      timezone: "UTC",
      autoBackup: true,
      backupInterval: "daily",
      alertsEnabled: true,
      emailNotifications: true,
      securityLevel: "high",
      logRetention: "30",
      maintenanceMode: false,
    }
    setConfig(defaultConfig)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">System Settings</h1>
          <p className="text-muted-foreground">Configure server preferences and system behavior</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-border/50 hover:bg-accent/50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black hover:opacity-90"
          >
            <Save className={`h-4 w-4 mr-2 ${saving ? "animate-spin" : ""}`} />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-[var(--mint)]" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverName">Server Name</Label>
              <Input
                id="serverName"
                value={config.serverName}
                onChange={(e) => setConfig((prev) => ({ ...prev, serverName: e.target.value }))}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Administrator Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={config.adminEmail}
                onChange={(e) => setConfig((prev) => ({ ...prev, adminEmail: e.target.value }))}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={config.timezone}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable server access</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={config.maintenanceMode}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, maintenanceMode: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[var(--emerald)]" />
              Backup Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup">Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">Enable scheduled backups</p>
              </div>
              <Switch
                id="autoBackup"
                checked={config.autoBackup}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoBackup: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupInterval">Backup Frequency</Label>
              <Select
                value={config.backupInterval}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, backupInterval: value }))}
                disabled={!config.autoBackup}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logRetention">Log Retention (days)</Label>
              <Input
                id="logRetention"
                type="number"
                value={config.logRetention}
                onChange={(e) => setConfig((prev) => ({ ...prev, logRetention: e.target.value }))}
                className="bg-background/50 border-border/50"
                min="1"
                max="365"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-400" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="securityLevel">Security Level</Label>
              <Select
                value={config.securityLevel}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, securityLevel: value }))}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Basic protection</SelectItem>
                  <SelectItem value="medium">Medium - Standard security</SelectItem>
                  <SelectItem value="high">High - Enhanced security</SelectItem>
                  <SelectItem value="maximum">Maximum - Strict policies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 rounded-lg bg-background/30 border border-border/30">
              <h4 className="font-medium mb-2">Current Security Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Firewall Status</span>
                  <span className="text-[var(--mint)]">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>SSL Certificate</span>
                  <span className="text-[var(--mint)]">Valid</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed Login Attempts</span>
                  <span className="text-yellow-400">3 (Last 24h)</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Security Scan</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alertsEnabled">System Alerts</Label>
                <p className="text-sm text-muted-foreground">Enable system status alerts</p>
              </div>
              <Switch
                id="alertsEnabled"
                checked={config.alertsEnabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, alertsEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send alerts via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={config.emailNotifications}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, emailNotifications: checked }))}
              />
            </div>

            <div className="p-4 rounded-lg bg-background/30 border border-border/30">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Alert Types
              </h4>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>High CPU usage &gt;80%</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Low disk space &lt;10%</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Service failures</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Security events</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Orbit Version</p>
              <p className="font-medium">v1.0.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Installation Date</p>
              <p className="font-medium">January 1, 2024</p>
            </div>
            <div>
              <p className="text-muted-foreground">License</p>
              <p className="font-medium">Professional</p>
            </div>
            <div>
              <p className="text-muted-foreground">Support Status</p>
              <p className="font-medium text-[var(--mint)]">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
