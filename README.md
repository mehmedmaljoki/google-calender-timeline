# Google Calendar Timeline for Obsidian

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-8B5CF6)](https://obsidian.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> A powerful Obsidian plugin that seamlessly integrates Google Calendar with an interactive timeline view, enabling you to visualize your schedule and create notes from calendar events with a single click.

## 🌟 Features

### 🔐 Secure Google Authentication

- OAuth 2.0 integration for secure Google Calendar access
- Persistent session management
- Easy connection/disconnection flow

### 📅 Multi-Calendar Support

- Display all calendars from your Google account
- Respect your Google Calendar visibility settings
- Color-coded events matching your Google Calendar themes
- Toggle calendar visibility within Obsidian

### 🕐 Interactive Timeline View

- Beautiful side-panel timeline visualization
- Daily, weekly, and monthly views
- Color-coded event blocks
- Smooth scrolling and navigation

- Responsive design matching Obsidian's aesthetics

### 📝 Seamless Note Creation

- Click any event to create a formatted markdown note
- Automatic note generation with:
  - Event title, date, and time
  - Description and location
  - Attendee information
  - Links back to Google Calendar

- Customizable note templates
- Configurable save location

### ⚡ Real-time Synchronization

- Background sync with configurable intervals
- Offline support with cached events
- Manual sync option
- Sync status indicators

## 🚀 Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Navigate to **Community Plugins** and disable Safe Mode
3. Click **Browse** and search for "Google Calendar Timeline"
4. Click **Install** and then **Enable**

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/mehmedmaljoki/google-calender-timeline/releases)
2. Extract the files to `{vault}/.obsidian/plugins/google-calendar-timeline/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### For Developers

```bash
# Clone the repository
git clone https://github.com/mehmedmaljoki/google-calender-timeline.git
cd google-calender-timeline

# Install dependencies
npm install

# Run tests (TDD workflow - MANDATORY before any feature work!)
npm test

# Build the plugin
npm run build

# Development mode with auto-rebuild
npm run dev
```

**⚠️ This project follows Test-Driven Development (TDD):**

- Write tests BEFORE implementing features
- See [TDD-GUIDE.md](docs/TDD-GUIDE.md) for complete workflow
- Minimum 70% test coverage required

## 📖 Usage

### Initial Setup

1. **Connect Google Calendar**
   - Open plugin settings
   - Click "Connect Google Account"
   - Authorize Obsidian in the Google OAuth flow
   - Grant calendar read permissions

2. **Configure Calendars**
   - Select which calendars to display
   - Customize colors (optional)
   - Set sync frequency

3. **Customize Note Template**
   - Define your preferred note structure
   - Set default save location
   - Configure file naming convention

### Using the Timeline

1. **Open Timeline Panel**
   - Click the calendar icon in the sidebar, or
   - Use command palette: "Google Calendar: Open Timeline"

2. **Navigate Events**
   - Scroll through the timeline
   - Use date picker for quick jumps
   - Click "Today" to return to current date

3. **Create Notes from Events**
   - Click on any event in the timeline
   - Review the generated note preview
   - Confirm to save the note in your vault

## ⚙️ Configuration

### Plugin Settings

| Setting                   | Description                            | Default          |
| ------------------------- | -------------------------------------- | ---------------- |
| **Sync Interval**         | How often to sync with Google Calendar | 15 minutes       |
| **Default Note Location** | Where to save event notes              | Root folder      |
| **Note Template**         | Customize note structure               | Default template |
| **Timeline View**         | Daily/Weekly/Monthly                   | Daily            |
| **Show Past Events**      | Display events before today            | Yes              |
| **Event Colors**          | Use Google Calendar colors             | Yes              |

### Note Template Variables

Use these placeholders in your custom templates:

- `{{title}}` - Event title
- `{{date}}` - Event date
- `{{time}}` - Event time
- `{{description}}` - Event description
- `{{location}}` - Event location
- `{{attendees}}` - List of attendees
- `{{calendar}}` - Calendar name
- `{{link}}` - Google Calendar link

### Example Custom Template

```markdown
---
created: { { date } }
type: meeting
calendar: { { calendar } }
---

# {{title}}

**When:** {{date}} at {{time}}
**Where:** {{location}}

## Attendees

{{attendees}}

## Notes

{{description}}

## Action Items

- [ ]

---

[Open in Google Calendar]({{link}})
```

## 🛠️ Development

### Tech Stack

- **TypeScript** - Type-safe plugin development
- **Obsidian API** - Plugin framework
- **Google Calendar API** - Calendar data access
- **OAuth 2.0** - Secure authentication
- **vis-timeline** - Timeline visualization
- **ESBuild** - Fast builds

### Project Structure

```
google-calender-timeline/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── auth/
│   │   ├── GoogleAuth.ts    # OAuth implementation
│   │   └── TokenManager.ts  # Token storage
│   ├── api/
│   │   └── CalendarAPI.ts   # Google Calendar API wrapper
│   ├── ui/
│   │   ├── Timeline.ts      # Timeline component
│   │   ├── SettingsTab.ts   # Settings UI
│   │   └── EventModal.ts    # Event details modal
│   ├── services/
│   │   ├── SyncService.ts   # Sync orchestration
│   │   └── NoteCreator.ts   # Note generation
│   └── types/
│       └── calendar.ts      # Type definitions
├── styles/
│   └── timeline.css         # Timeline styles
├── docs/
│   └── plugin-context.md    # Plugin specification
├── .github/
│   └── workflows/           # CI/CD pipelines
├── manifest.json            # Plugin manifest
├── package.json
└── tsconfig.json
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## 📋 Roadmap

- [x] Basic Google Calendar integration
- [x] Timeline visualization
- [x] Note creation from events
- [x] Multi-calendar support
- [ ] Bi-directional sync (create/edit events in Obsidian)
- [ ] Week/month view
- [ ] Event search and filtering
- [ ] Recurring event optimization
- [ ] Google Tasks integration
- [ ] Calendar event templates
- [ ] Daily notes integration
- [ ] Mobile support optimization

## 🐛 Bug Reports & Feature Requests

Found a bug? Have an idea? Please [open an issue](https://github.com/mehmedmaljoki/google-calender-timeline/issues/new/choose) using our templates.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md) - The best knowledge management tool
- [Google Calendar API](https://developers.google.com/calendar) - Calendar data access
- [vis-timeline](https://visjs.org/) - Timeline visualization library
- All our [contributors](https://github.com/mehmedmaljoki/google-calender-timeline/graphs/contributors)

## 💬 Support

- 📖 [Documentation](https://github.com/mehmedmaljoki/google-calender-timeline/wiki)
- 💬 [Discussions](https://github.com/mehmedmaljoki/google-calender-timeline/discussions)
- 🐛 [Issue Tracker](https://github.com/mehmedmaljoki/google-calender-timeline/issues)

---

<p align="center">Made with ❤️ for the Obsidian community</p>
gle-calender-timeline/graphs/contributors)

## 💬 Support

- 📖 [Documentation](https://github.com/mehmedmaljoki/google-calender-timeline/wiki)
- 💬 [Discussions](https://github.com/mehmedmaljoki/google-ca
  lender-timeline/discussions)
- 🐛 [Issue Tracker](https://github.com/mehmedmaljoki/google-calender-timeline/issues)

---

<p align="center">Made with ❤️ for the Obsidian community</p>
