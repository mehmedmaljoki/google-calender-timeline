# Google Calendar Timeline Plugin for Obsidian

## Project Overview

An Obsidian plugin that synchronizes Google Calendar events and displays them in an interactive timeline view with the ability to create notes from calendar entries.

## Core Features

### 1. Google Authentication

- OAuth 2.0 integration for secure Google Calendar access
- Login flow through Google authentication
- Persistent authentication state (token management)
- Support for multiple Google accounts (if needed)

### 2. Calendar Synchronization

- Fetch and display all calendar events from the authenticated Google account
- Support for multiple calendars from the same account
- Respect Google Calendar visibility settings (show/hide calendars as configured in Google)
- Real-time or periodic sync to keep events up-to-date
- Display event details: title, time, description, location, attendees

### 3. Timeline Visualization

- Side panel with timeline view showing daily schedule
- Visual timeline using a timeline library with proper styling
- Color-coded events (matching Google Calendar colors or custom color scheme)
- Interactive timeline that allows scrolling through days
- Clear time markers and event blocks
- Responsive design that fits Obsidian's interface

### 4. Note Creation from Events

- Click on any calendar event to create a corresponding note
- Notes are created as .md files in the current/root folder
- Note template should include:
  - Event title as note title
  - Event date and time
  - Event description
  - Location (if available)
  - Attendees (if available)
  - Link back to Google Calendar event (optional)
- Automatic file naming based on event title and date

### 5. Multi-Calendar Support

- Display events from all calendars associated with the account
- Visual distinction between different calendars (colors)
- Filter/toggle visibility of specific calendars
- Honor Google Calendar settings for which calendars are shown

## Technical Requirements

### Dependencies

- Google Calendar API client library
- OAuth 2.0 library for authentication
- Timeline visualization library (e.g., vis-timeline, timeline-js, or similar)
- Obsidian API for plugin development

### Architecture

- **Authentication Module**: Handle Google OAuth flow and token management
- **Sync Module**: Fetch events from Google Calendar API
- **Timeline UI Module**: Render timeline view with events
- **Note Creation Module**: Generate markdown files from event data
- **Settings Module**: Configuration for sync interval, note templates, folder paths, calendar visibility

### Data Storage

- Store OAuth tokens securely
- Cache calendar events locally for offline viewing
- Track sync state and last sync timestamp
- Store user preferences (selected calendars, colors, etc.)

## User Interface

### Timeline Panel

- Vertical or horizontal timeline layout (configurable)
- Date/time axis with clear markers
- Event blocks with:
  - Event title
  - Time range
  - Color indicator (from calendar color)
  - Hover tooltip with more details
- Navigation controls (today, prev/next day, date picker)

### Settings Panel

- Google Account connection status
- Connect/Disconnect button
- Calendar selection (which calendars to display)
- Sync frequency settings
- Note template customization
- Default folder for created notes
- Timeline appearance settings (colors, layout)

### Event Interaction

- Single click on event: Show event details
- Double click or action button: Create note from event
- Context menu options (optional):
  - Open in Google Calendar
  - Create note
  - Copy event details

## Security & Privacy

- Secure OAuth token storage using Obsidian's API
- No server-side component (client-side only)
- User data remains local
- Clear permissions request during authentication

## Future Enhancements (Optional)

- Bi-directional sync (create/edit events in Obsidian)
- Week/month view in addition to daily timeline
- Event search and filtering
- Recurring event handling
- Reminders and notifications
- Calendar event templates for different event types
- Integration with Obsidian's daily notes
- Task integration (Google Tasks)
