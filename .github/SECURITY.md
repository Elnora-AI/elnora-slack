# Security Policy

## Supported Versions

The latest published `0.x` release is supported. Once `1.0.0` ships, the current
major line is supported.

## Reporting a Vulnerability

**DO NOT open a public GitHub issue for security vulnerabilities.**

Please report security vulnerabilities via one of the following channels:

- **Email:** [security@elnora.ai](mailto:security@elnora.ai)
- **GitHub Security Advisories:** [Report a vulnerability](https://github.com/Elnora-AI/elnora-slack/security/advisories/new)

Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgement:** Within 48 hours of report
- **Initial assessment:** Within 5 business days
- **Fix and disclosure:** Within 90 days of report

## Responsible Disclosure

We follow a 90-day disclosure timeline. We ask that you:

- Allow us reasonable time to fix the issue before public disclosure
- Do not access or modify other users' data
- Do not perform actions that could negatively impact other users
- Act in good faith to avoid privacy violations, data destruction, and service disruption

## Scope

**In scope:**

- The `elnora-slack` CLI and plugin code in this repository
- Credential handling (env-var resolution, `~/.config/elnora-slack/.env` storage, token redaction)
- Input validation, the SSRF host allow-list, and the publication guard (`scripts/check-no-populated-references.mjs`)

**Out of scope:**

- Third-party dependencies (please report to their respective maintainers)
- The Slack Web API itself (report to Slack)
- The scopes a user grants their own Slack app — those are the user's choice
- Social engineering attacks against Elnora staff
- Denial of service attacks
- Issues in services not operated by Elnora

## Security Best Practices for Users

- Never commit tokens to version control — keep them in `~/.config/elnora-slack/.env` (or your environment).
- Grant your Slack app only the scopes you need. Start from [`app-manifest.json`](../app-manifest.json) and remove any your workflows don't use.
- Prefer a bot token (`xoxb-`). Add a user token (`xoxp-`) only if you need `search.*`.
- Rotate tokens periodically, and revoke immediately if one is exposed.
- Keep the generated `workspace-*.md` reference cache out of version control (it is gitignored by default).
