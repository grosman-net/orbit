"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UsersIcon, Search, Plus, UserCheck, UserX, Settings } from "lucide-react"

interface User {
  id: number
  username: string
  role: string
  status: "online" | "offline"
  lastLogin: string
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Fetch users from API
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users")
        const data = await response.json()
        setUsers(data.users)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      }
    }

    fetchUsers()
  }, [])

  const toggleUserStatus = (id: number) => {
    const updatedUsers = users.map((user) =>
      user.id === id
        ? { ...user, status: user.status === "online" ? ("offline" as const) : ("online" as const) }
        : user,
    )
    setUsers(updatedUsers)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    return status === "online"
      ? "bg-[var(--mint)]/20 text-[var(--mint)] border-[var(--mint)]/30"
      : "bg-muted text-muted-foreground border-border"
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "administrator":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "developer":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "monitor":
        return "bg-[var(--emerald)]/20 text-[var(--emerald)] border-[var(--emerald)]/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">User Management</h1>
          <p className="text-muted-foreground">Manage server users and permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-[var(--mint)] to-[var(--emerald)] text-black hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Stats */}
      <Card className="gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total: {users.length}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--mint)] rounded-full"></div>
                <span>Online: {users.filter((u) => u.status === "online").length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span>Offline: {users.filter((u) => u.status === "offline").length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card
            key={user.id}
            className="gradient-card border-border/50 hover:border-[var(--mint)]/30 transition-all duration-300"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[var(--mint)]/20 text-[var(--mint)] font-semibold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{user.username}</h3>
                      <Badge variant="outline" className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Last login: {user.lastLogin}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.id)}
                    className={
                      user.status === "online"
                        ? "border-red-500/30 hover:bg-red-500/10 text-red-400"
                        : "border-[var(--mint)]/30 hover:bg-[var(--mint)]/10 text-[var(--mint)]"
                    }
                  >
                    {user.status === "online" ? (
                      <>
                        <UserX className="h-4 w-4 mr-1" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="border-border/50 hover:bg-accent/50 bg-transparent">
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
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
                {searchTerm ? "Try adjusting your search terms" : "No users are currently registered"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--mint)]">
              {users.filter((u) => u.status === "online").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently logged in</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {users.filter((u) => u.role === "Administrator").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Admin privileges</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--emerald)]">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
