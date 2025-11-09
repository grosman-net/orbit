"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface UbuntuPackage {
  name: string
  version: string
  status: "installed" | "config-files" | "half-installed" | "not-installed"
  priority?: string
  description?: string
}

interface PackageSearchResult {
  name: string
  description: string
}

export function Packages() {
  const [packages, setPackages] = useState<UbuntuPackage[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<PackageSearchResult[]>([])
  const [installing, setInstalling] = useState(false)
  const [installQuery, setInstallQuery] = useState("")
  const [installDialogOpen, setInstallDialogOpen] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    void refreshPackages()
  }, [])

  useEffect(() => {
    if (!installDialogOpen) {
      setInstallQuery("")
      setSearchResults([])
    }
  }, [installDialogOpen])

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
    )
  }, [packages, searchTerm])

  const refreshPackages = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/packages?limit=250", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { packages: UbuntuPackage[] }
      setPackages(data.packages ?? [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Failed to load packages",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const runPackageAction = async (action: AptAction, packageName?: string) => {
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, package: packageName }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { message?: string }
      toast({
        title: "Package operation started",
        description: data.message ?? `${action} command has been issued.`,
      })
      await refreshPackages()
    } catch (error) {
      toast({
        title: "Package operation failed",
        description: error instanceof Error ? error.message : "Unable to complete package action",
        variant: "destructive",
      })
    }
  }

  const handleInstallSearch = async (query: string) => {
    setInstallQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    try {
      const response = await fetch(`/api/packages?search=${encodeURIComponent(query)}&limit=50`, {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { results: PackageSearchResult[] }
      setSearchResults(data.results ?? [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Unable to search packages",
        variant: "destructive",
      })
    }
  }

  const handleInstall = async (packageName: string) => {
    setInstalling(true)
    await runPackageAction("install", packageName)
    setInstalling(false)
    setInstallDialogOpen(false)
  }

  const handleRemove = async (packageName: string) => {
    await runPackageAction("purge", packageName)
  }

  const installedCount = packages.filter((pkg) => pkg.status === "installed").length
  const configFilesCount = packages.filter((pkg) => pkg.status === "config-files").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Package Management</h1>
          <p className="text-muted-foreground">Manage Ubuntu packages with apt</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => runPackageAction("update")}
            className="border-border/50 hover:bg-accent/50 bg-transparent"
          >
            apt update
          </Button>
          <Button
            variant="outline"
            onClick={() => runPackageAction("upgrade")}
            className="border-border/50 hover:bg-accent/50 bg-transparent"
          >
            apt upgrade
          </Button>
          <Button
            variant="outline"
            onClick={refreshPackages}
            disabled={loading}
            className="border-[var(--mint)]/30 hover:bg-[var(--mint)]/10 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Install Package
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Install a new package</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search for packages..."
                  value={installQuery}
                  onChange={(event) => void handleInstallSearch(event.target.value)}
                  autoFocus
                />
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.length === 0 && installQuery.length >= 2 && (
                    <p className="text-sm text-muted-foreground">No packages found.</p>
                  )}
                  {searchResults.map((result) => (
                    <Card key={result.name} className="border-border/50 bg-background/60">
                      <CardContent className="py-3 px-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-xs text-muted-foreground">{result.description}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => void handleInstall(result.name)}
                          disabled={installing}
                          className="bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black hover:opacity-90"
                        >
                          Install
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInstallDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter packages..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Total: {packages.length}</span>
              <span>Installed: {installedCount}</span>
              <span>Config files: {configFilesCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredPackages.map((pkg) => (
          <Card key={pkg.name} className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-[var(--mint)]/10">
                    <Package className="h-5 w-5 text-[var(--mint)]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        v{pkg.version}
                      </Badge>
                      <StatusBadge status={pkg.status} />
                      {pkg.priority && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {pkg.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pkg.description ?? "Installed via apt"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRemove(pkg.name)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={pkg.status !== "installed"}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <Card className="gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No packages found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "No packages are currently installed."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

type AptAction = "install" | "remove" | "purge" | "update" | "upgrade"

function StatusBadge({ status }: { status: UbuntuPackage["status"] }) {
  switch (status) {
    case "installed":
      return (
        <Badge variant="outline" className="bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30">
          Installed
        </Badge>
      )
    case "config-files":
      return <Badge variant="outline">Config files</Badge>
    case "half-installed":
      return <Badge variant="destructive">Half-installed</Badge>
    default:
      return <Badge variant="outline">Not installed</Badge>
  }
}
