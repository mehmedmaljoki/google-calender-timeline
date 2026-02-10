# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The Google Calendar Timeline team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[INSERT SECURITY EMAIL]**

Include the following information in your report:

1. **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
2. **Full paths of source file(s)** related to the manifestation of the issue
3. **Location of the affected source code** (tag/branch/commit or direct URL)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact of the issue**, including how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

- **Initial Response**: You should receive an acknowledgment within 48 hours
- **Status Updates**: We'll keep you informed about the progress of the fix
- **Disclosure Timeline**: We aim to disclose vulnerabilities within 90 days of the initial report
- **Credit**: If you wish, we'll credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

1. **Keep the plugin updated** to the latest version
2. **Review permissions** before granting OAuth access
3. **Use strong passwords** for your Google account
4. **Enable 2FA** on your Google account
5. **Be cautious** about which calendars you sync
6. **Regularly review** connected applications in your Google account settings

### For Developers

1. **OAuth Token Security**
   - Store tokens securely using Obsidian's secure storage API
   - Never log tokens in production
   - Implement proper token refresh mechanisms
   - Invalidate tokens on logout

2. **API Security**
   - Validate all API responses
   - Implement rate limiting
   - Use HTTPS for all API calls
   - Handle API errors gracefully without exposing sensitive information

3. **Data Protection**
   - Minimize data storage
   - Encrypt sensitive data at rest
   - Clear caches appropriately
   - Don't store unnecessary calendar data

4. **Input Validation**
   - Sanitize all user inputs
   - Validate calendar event data
   - Prevent injection attacks in note generation
   - Escape markdown content properly

5. **Dependency Management**
   - Regularly update dependencies
   - Audit dependencies for vulnerabilities (`npm audit`)
   - Use only trusted packages
   - Pin dependency versions

## Known Security Considerations

### OAuth Flow

- The plugin uses OAuth 2.0 for Google Calendar access
- Tokens are stored locally in Obsidian's secure storage
- No server-side component means no centralized token storage

### Permissions

The plugin requests the following Google Calendar scopes:

- `https://www.googleapis.com/auth/calendar.readonly` - Read calendar events
- `https://www.googleapis.com/auth/calendar.events` - (Future) Create/edit events

### Data Storage

- Calendar events are cached locally for offline access
- No data is sent to third-party servers
- All data remains within your Obsidian vault

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed. Updates will be:

1. Released as a patch version (e.g., 1.2.3 → 1.2.4)
2. Documented in the [CHANGELOG.md](CHANGELOG.md)
3. Announced in the GitHub releases
4. Accompanied by a security advisory if severe

## Bug Bounty Program

Currently, we do not have a formal bug bounty program. However, we greatly appreciate security researchers who responsibly disclose vulnerabilities and may recognize them in our documentation and release notes.

## Questions?

If you have questions about this security policy, please open a discussion in our [GitHub Discussions](https://github.com/mehmedmaljoki/google-calender-timeline/discussions).

---

**Last Updated**: February 2026
