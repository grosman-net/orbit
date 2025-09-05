"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Package, Search, Plus, RefreshCw } from "lucide-react"

interface PackageItem {
  id: number
  name: string
  version: string
  status: "active" | "inactive"
  description: string
}

export function Packages() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = () => {
    // Fetch packages from API
    const fetchPackages = async () => {
      try {
        const response = await fetch("/api/packages")
        const data = await response.json()
        setPackages(data.packages)
      } catch (error) {
        console.error("Failed to fetch packages:", error)
      }
    }

    fetchPackages()
  }

  const savePackages = (updatedPackages: PackageItem[]) => {
    localStorage.setItem("orbit-packages", JSON.stringify(updatedPackages))
    setPackages(updatedPackages)
  }

  const togglePackageStatus = (id: number) => {
    const updatedPackages = packages.map((pkg) =>
      pkg.id === id ? { ...pkg, status: pkg.status === "active" ? ("inactive" as const) : ("active" as const) } : pkg,
    )
    savePackages(updatedPackages)
  }

  const refreshPackages = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Simulate refresh by adding a random package
      const newPackage: PackageItem = {
        id: Date.now(),
        name: `service-${Math.floor(Math.random() * 1000)}`,
        version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        status: Math.random() > 0.5 ? "active" : "inactive",
        description: "Automatically discovered service",
      }
      savePackages([...packages, newPackage])
    }, 1500)
  }

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Package Management</h1>
          <p className="text-muted-foreground">Manage installed packages and services</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshPackages}
            disabled={loading}
            className="border-[var(--mint)]/30 hover:bg-[var(--mint)]/10 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" />
            Install Package
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total: {packages.length}</span>
              <span>Active: {packages.filter((p) => p.status === "active").length}</span>
              <span>Inactive: {packages.filter((p) => p.status === "inactive").length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package List */}
      <div className="grid gap-4">
        {filteredPackages.map((pkg) => (
          <Card
            key={pkg.id}
            className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-[var(--mint)]/10">
                    <Package className="h-5 w-5 text-[var(--mint)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        v{pkg.version}
                      </Badge>
                      <Badge
                        variant={pkg.status === "active" ? "default" : "secondary"}
                        className={
                          pkg.status === "active"
                            ? "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {pkg.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {pkg.status === "active" ? "Enabled" : "Disabled"}
                    </span>
                    <Switch checked={pkg.status === "active"} onCheckedChange={() => togglePackageStatus(pkg.id)} />
                  </div>
                  <Button variant="outline" size="sm" className="border-border/50 hover:bg-accent/50 bg-transparent">
                    Configure
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
                {searchTerm ? "Try adjusting your search terms" : "No packages are currently installed"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
