# Installation & Quick Start Guide

## 📦 Installation

### Method 1: Manual Installation (Recommended for Testing)

1. **Download the plugin files**:
   - `main.js` - Plugin code
   - `manifest.json` - Plugin manifest
   - `styles.css` - Styling

2. **Copy to Obsidian**:

   ```
   <your-vault>/.obsidian/plugins/google-calendar-timeline/
   ```

3. **Enable the plugin**:
   - Open Obsidian
   - Go to Settings → Community plugins
   - Find "Google Calendar Timeline" and enable it

### Method 2: Obsidian Community Plugins (After Approval)

1. Open Obsidian Settings
2. Navigate to Community plugins
3. Click "Browse"
4. Search for "Google Calendar Timeline"
5. Click "Install" and then "Enable"

## 🚀 Quick Start

### 1. Connect to Google Calendar

**First Time Setup:**

1. Open Command Palette (`Ctrl/Cmd + P`)
2. Run: `Google Calendar: Connect to Google Calendar`
3. You'll need to set up Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials (Desktop app)
   - Copy Client ID and Client Secret
   - Update `src/auth/GoogleAuth.ts` with your credentials:
     ```typescript
     private readonly CLIENT_ID = 'your-client-id';
     private readonly CLIENT_SECRET = 'your-client-secret';
     ```
   - Rebuild: `npm run build`

4. Follow the authentication flow in your browser
5. Grant calendar permissions
6. Return to Obsidian

### 2. Open Timeline View

**Option A: Ribbon Icon**

- Click the calendar icon in the left ribbon

**Option B: Command Palette**

- Open Command Palette (`Ctrl/Cmd + P`)
- Run: `Google Calendar: Open Timeline`

**Option C: Right Sidebar**

- The timeline will open automatically in the right sidebar

### 3. View Your Events

The timeline shows:

- 📅 All your calendar events
- 🎨 Color-coded by calendar
- ⏰ Time-based visualization
- 📝 Event details on click

**Navigation:**

- **Today**: Jump to current date
- **←/→**: Navigate days
- **Scroll**: Zoom in/out
- **Drag**: Pan timeline

### 4. Create Notes from Events

**Method 1: Double-click**

- Double-click any event on the timeline
- Note is automatically created

**Method 2: Event Modal**

- Single-click an event
- Click "Create Note" button

**Note Content:**

- Event title as heading
- Date and time
- Location (if available)
- Description
- Attendees list
- Link to Google Calendar event

### 5. Customize Settings

Open Settings → Google Calendar Timeline:

**Synchronization:**

- ⚡ Enable auto-sync (default: every 15 minutes)
- 🔄 Adjust sync interval
- ⏰ Manual sync button

**Display:**

- 🎨 Use Google Calendar colors
- 📆 Show/hide past events
- ⏱️ Set timeline start/end hours (e.g., 8 AM - 8 PM)

**Note Creation:**

- 📁 Choose note location folder
- 📝 Customize note template
- 🏷️ File naming strategy:
  - **Event Title**: `Meeting with Team.md`
  - **Date - Title**: `2024-01-15 - Meeting with Team.md`
  - **Custom**: Use template like `{{date}}-{{title}}.md`
- ✅ Auto-open notes after creation

**Template Variables:**

```
{{title}}       - Event title
{{date}}        - Event date (YYYY-MM-DD)
{{time}}        - Event time (HH:MM)
{{description}} - Event description
{{location}}    - Event location
{{attendees}}   - Attendees list
{{calendar}}    - Calendar name
{{link}}        - Google Calendar link
{{id}}          - Event ID
```

### 6. Multi-Calendar Support

The plugin automatically syncs **all your Google Calendars**:

- 📆 Primary calendar
- 📅 Shared calendars
- 🎨 Each with original colors
- 🔄 Synced together

## 🎯 Common Use Cases

### Daily Planning

1. Open timeline at start of day
2. See all meetings and appointments
3. Create preparation notes for important events

### Meeting Notes

1. Before/during meeting, click event
2. Create note with pre-filled details
3. Add your meeting notes
4. Link back to event in Google Calendar

### Project Management

1. View project-related calendar events
2. Create notes for milestones and deadlines
3. Track progress with timeline visualization

### Weekly Review

1. Navigate to past week
2. Review all events
3. Create retrospective notes

## ⌨️ Keyboard Shortcuts

You can set custom shortcuts in Obsidian Settings:

- `Open Timeline` - Open calendar timeline view
- `Sync Now` - Manually sync calendars
- `Connect to Google` - Initiate authentication
- `Disconnect` - Log out from Google

## 🔧 Troubleshooting

### Authentication Issues

**"Not connected" error:**

1. Check internet connection
2. Run `Google Calendar: Connect to Google Calendar`
3. Complete OAuth flow in browser
4. Verify OAuth credentials are correct

**Token expired:**

- Plugin auto-refreshes tokens
- If issues persist, disconnect and reconnect

### Sync Problems

**Events not showing:**

1. Check sync status in settings
2. Run manual sync: `Google Calendar: Sync calendars now`
3. Verify calendar permissions in Google

**Slow sync:**

- Reduce sync interval in settings
- Check number of calendars (more = slower)

### Timeline Issues

**Timeline empty:**

1. Verify authentication
2. Check date range (use Today button)
3. Ensure "Show past events" is enabled if viewing history

**Events not clickable:**

- Refresh timeline (refresh button in header)
- Reopen timeline view

### Note Creation Fails

**Permission errors:**

- Check note location folder exists
- Verify Obsidian has write permissions

**Template errors:**

- Review template syntax in settings
- Ensure all `{{variables}}` are valid

## 📚 Advanced Usage

### Custom Note Templates

Create rich note templates in settings:

```markdown
# {{title}}

## 📅 Event Details

- **Date**: {{date}}
- **Time**: {{time}}
- **Location**: {{location}}

## 👥 Attendees

{{attendees}}

## 📝 Notes

<!-- Add your notes here -->

## 🔗 Links

- [Open in Google Calendar]({{link}})

---

Created from calendar event on {{date}}
```

### Folder Organization

Organize notes by:

**By Date:**

- Location: `Calendar/2024/01/`
- Template: `{{date}}-{{title}}`

**By Calendar:**

- Location: `Calendar/{{calendar}}/`
- Requires manual setup per calendar

**By Type:**

- Meetings: `Meetings/`
- Events: `Events/`
- Tasks: `Tasks/`

### Integration with Other Plugins

**Dataview:**

```dataview
TABLE time, location, attendees
FROM "Calendar"
WHERE date = date(today)
SORT time ASC
```

**Calendar Plugin:**

- Notes created by this plugin work with Obsidian Calendar
- Use YAML frontmatter:
  ```yaml
  ---
  date: { { date } }
  event: true
  ---
  ```

**Templater:**

- Combine with Templater for advanced templates
- Use `<% tp.date.now() %>` alongside `{{title}}`

## 🆘 Support

### Getting Help

1. **Check Documentation**: [GitHub Wiki](https://github.com/YOUR_USERNAME/google-calendar-timeline/wiki)
2. **Search Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/google-calendar-timeline/issues)
3. **Ask Questions**: [Discussions](https://github.com/YOUR_USERNAME/google-calendar-timeline/discussions)
4. **Report Bugs**: [New Issue](https://github.com/YOUR_USERNAME/google-calendar-timeline/issues/new)

### Useful Links

- 📖 [Full Documentation](https://github.com/YOUR_USERNAME/google-calendar-timeline/blob/main/README.md)
- 🏗️ [Architecture Guide](https://github.com/YOUR_USERNAME/google-calendar-timeline/blob/main/docs/ARCHITECTURE.md)
- 🤝 [Contributing](https://github.com/YOUR_USERNAME/google-calendar-timeline/blob/main/CONTRIBUTING.md)
- 🔒 [Security](https://github.com/YOUR_USERNAME/google-calendar-timeline/blob/main/SECURITY.md)

## 🎉 You're All Set!

Enjoy your integrated Google Calendar experience in Obsidian! 🚀
