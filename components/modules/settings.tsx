"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FileText, RefreshCw, Save, Server } from "lucide-react"

interface ManagedConfig {
  id: string
  label: string
  path: string
  description: string
  requiresReload?: string
}

export function Settings() {
  const [configs, setConfigs] = useState<ManagedConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<ManagedConfig | null>(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    void loadConfigList()
  }, [])

  const loadConfigList = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/config", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { configs: ManagedConfig[] }
      setConfigs(data.configs ?? [])
      if (data.configs?.length) {
        void loadConfigContent(data.configs[0])
      }
    } catch (error) {
      toast({
        title: "Failed to load configuration index",
        description: error instanceof Error ? error.message : "Unable to list managed configuration files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadConfigContent = async (config: ManagedConfig) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/config/${config.id}`, { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { content: string }
      setSelectedConfig(config)
      setContent(data.content ?? "")
    } catch (error) {
      toast({
        title: "Unable to read configuration",
        description: error instanceof Error ? error.message : "Failed to open the selected configuration file",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!selectedConfig) return
    setSaving(true)
    try {
      const response = await fetch(`/api/config/${selectedConfig.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: "Configuration saved",
        description: selectedConfig.requiresReload
          ? `Apply changes by running: ${selectedConfig.requiresReload}`
          : "Changes have been written to disk.",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unable to write configuration file",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Configuration Editor</h1>
          <p className="text-muted-foreground">
            Manage key Ubuntu services such as Nginx, OpenSSH, and UFW directly from the Orbit console.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadConfigList()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh list
          </Button>
          <Button onClick={() => void saveConfig()} disabled={saving || !selectedConfig}>
            <Save className={`h-4 w-4 mr-2 ${saving ? "animate-spin" : ""}`} />
            Save changes
          </Button>
        </div>
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-[var(--mint)]" />
            Select configuration file
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedConfig?.id}
            onValueChange={(value) => {
              const config = configs.find((item) => item.id === value)
              if (config) {
                void loadConfigContent(config)
              }
            }}
          >
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="Choose a configuration file" />
            </SelectTrigger>
            <SelectContent>
              {configs.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedConfig && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{selectedConfig.label}</strong> — {selectedConfig.description}
              </p>
              <p>Path: <code className="text-xs">{selectedConfig.path}</code></p>
              {selectedConfig.requiresReload && (
                <p>
                  Reload command: <code className="text-xs">{selectedConfig.requiresReload}</code>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--mint)]" />
            Configuration content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            spellCheck={false}
            rows={20}
            className="font-mono text-sm bg-background/60 border-border/40"
            disabled={loading || !selectedConfig}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Changes are written using sudo. Ensure that the Orbit service account has permission to manage these files.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
