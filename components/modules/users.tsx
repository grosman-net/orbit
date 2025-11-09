"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Lock, Plus, Search, Trash2, Unlock, Users as UsersIcon } from "lucide-react"

interface SystemUser {
  username: string
  uid: number
  gid: number
  gecos?: string
  home: string
  shell: string
  locked: boolean
  loggedIn: boolean
  lastLogin?: string
}

interface CreateUserForm {
  username: string
  shell: string
  home: string
}

export function Users() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CreateUserForm>({
    username: "",
    shell: "/bin/bash",
    home: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    void refreshUsers()
  }, [])

  const refreshUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const data = (await response.json()) as { users: SystemUser[] }
      setUsers(data.users ?? [])
    } catch (error) {
      toast({
        title: "Failed to load users",
        description: error instanceof Error ? error.message : "Unable to fetch system users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(term) ||
        user.shell.toLowerCase().includes(term) ||
        user.home.toLowerCase().includes(term) ||
        (user.gecos?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [users, searchTerm])

  const handleLockChange = async (user: SystemUser, lock: boolean) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: lock ? "lock" : "unlock", username: user.username }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: lock ? "User locked" : "User unlocked",
        description: `${user.username} has been ${lock ? "disabled" : "enabled"}.`,
      })
      await refreshUsers()
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "Unable to update user",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (user: SystemUser) => {
    if (!confirm(`Delete user ${user.username} and remove their home directory?`)) {
      return
    }
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", username: user.username }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: "User removed",
        description: `${user.username} has been deleted.`,
      })
      await refreshUsers()
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "Unable to delete user",
        variant: "destructive",
      })
    }
  }

  const handleCreate = async () => {
    if (form.username.trim().length === 0) {
      toast({
        title: "Username required",
        description: "Please enter a valid username.",
        variant: "destructive",
      })
      return
    }
    setCreating(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          username: form.username.trim(),
          shell: form.shell.trim(),
          home: form.home.trim() || undefined,
        }),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      toast({
        title: "User created",
        description: `${form.username} has been added.`,
      })
      setDialogOpen(false)
      setForm({ username: "", shell: "/bin/bash", home: "" })
      await refreshUsers()
    } catch (error) {
      toast({
        title: "Unable to create user",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const total = users.length
  const active = users.filter((user) => user.loggedIn).length
  const locked = users.filter((user) => user.locked).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-balance">User Management</h1>
          <p className="text-muted-foreground">Manage Linux accounts on this Ubuntu server</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refreshUsers()} disabled={loading}>
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new user</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="e.g. deploy"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shell">Shell</Label>
                  <Input
                    id="shell"
                    value={form.shell}
                    onChange={(event) => setForm((prev) => ({ ...prev, shell: event.target.value }))}
                    placeholder="/bin/bash"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home">Home directory (optional)</Label>
                  <Input
                    id="home"
                    value={form.home}
                    onChange={(event) => setForm((prev) => ({ ...prev, home: event.target.value }))}
                    placeholder="/home/deploy"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void handleCreate()} disabled={creating}>
                  {creating ? "Creating..." : "Create user"}
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
                placeholder="Search by username, shell, or description..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Total: {total}</span>
              <span>Logged in: {active}</span>
              <span>Locked: {locked}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.username} className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[var(--mint)]/20 text-[var(--mint)] font-semibold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{user.username}</h3>
                      <Badge variant="outline" className={user.loggedIn ? "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30" : "bg-muted text-muted-foreground border-border"}>
                        {user.loggedIn ? "Online" : "Offline"}
                      </Badge>
                      {user.locked && (
                        <Badge variant="destructive" className="text-xs">
                          Locked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      UID {user.uid} · Home {user.home} · Shell {user.shell}
                    </p>
                    {user.lastLogin && (
                      <p className="text-xs text-muted-foreground mt-1">Last login: {user.lastLogin}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleLockChange(user, !user.locked)}
                    className={user.locked ? "border-[var(--mint)]/30 text-[var(--mint)] hover:bg-[var(--mint)]/10" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"}
                  >
                    {user.locked ? (
                      <>
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDelete(user)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
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

      {filteredUsers.length === 0 && (
        <Card className="gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms" : "No users are currently listed."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Logged in users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--mint)]">{active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active sessions</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Locked accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{locked}</div>
            <p className="text-xs text-muted-foreground mt-1">Require unlock to sign in</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--emerald)]">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Users with UID ≥ 1000</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
