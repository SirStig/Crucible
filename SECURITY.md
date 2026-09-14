# Security Policy

## Supported versions

Crucible is pre-1.0. Fixes land on the latest released minor version only.

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/SirStig/Crucible/security/advisories/new)
rather than opening a public issue. Expect an initial response within a week.

## Scope notes

Crucible reads files you point it at and renders SVG you supply. Two things
are worth knowing:

- SVG rendering goes through [resvg](https://github.com/yisibl/resvg-js), which
  does not execute scripts or fetch remote resources. Treat untrusted SVG with
  the same care you would any untrusted input regardless.
- The MCP server speaks stdio to a local client and opens no network listener.
  It reads rubric and style-profile files from paths the caller provides, so
  the caller controls what it can reach.
