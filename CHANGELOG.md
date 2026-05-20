# Changelog

All notable changes to this project are documented here.

## [1.2.1] - 2026-05-20

### Security

- CSRF protection on all mutating API requests; token returned with session and login
- HTTP security headers (CSP, HSTS behind TLS, X-Frame-Options DENY, and others)
- Trusted proxy list for client IP and rate limiting (`trusted_proxies` in config)
- Stronger admin password policy: 12+ characters, upper, lower, digit; cannot equal username
- Setup generates a random initial password instead of copying the username
- Session rotation on login; refuse to start if `session_secret` is shorter than 32 bytes
- Validated APT search queries; package info uses the same name rules as install
- Config writes run `sshd -t` / `nginx -t` on a temp file before replacing live files
- Audit log for authenticated write operations: `/var/log/orbit/audit.log`
- Frontend escapes dynamic HTML; config raw editor uses a DOM textarea instead of `innerHTML`
- Optional direct TLS via `tls_cert` and `tls_key` in config
- Configurable `bind_address`

### Other

- Fixed CI workflow (Go test/vet instead of unused Node pipeline)
- Added unit tests for password policy, package names, and network validators
- README rewritten for clarity

## [1.2.0] - 2025-12-03

- RHEL/CentOS/Rocky/AlmaLinux support with RPM packages
- License changed to Apache 2.0

## [1.1.3] - 2025-12-03

- Secure cookies when `public_url` is HTTPS
- Safer config save via temp files in `/tmp`
- Clearer errors when deleting the logged-in user

## [1.1.2] - 2025-11-11

- Session handling after reinstall without manual cookie clearing
- Logs API parameter validation

## [1.1.1] - 2025-11-11

- Fixed command injection in network, services, and user management
- Login rate limiting
- See [SECURITY_FIXES_v1.1.1.md](SECURITY_FIXES_v1.1.1.md) for details

## [1.1.0] - 2025-11-10

- APT repository and `orbitctl` package name

Older releases: see git tags and [RELEASE_NOTES.md](RELEASE_NOTES.md).
