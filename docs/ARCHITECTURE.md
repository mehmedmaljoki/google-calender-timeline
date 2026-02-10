# Architecture Documentation

## Overview

Google Calendar Timeline is built as a modern Obsidian plugin using TypeScript, following clean architecture principles and SOLID design patterns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Obsidian Plugin API                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Main Plugin                          │
│  (Initialization, Lifecycle Management, Command Registry)    │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
        ┌────────────┐ ┌─────────┐ ┌────────────┐
        │    Auth    │ │   API   │ │     UI     │
        │  Service   │ │ Service │ │ Components │
        └────────────┘ └─────────┘ └────────────┘
                 │            │            │
                 └────────────┼────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Business Logic  │
                    │   (Services)     │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Local Store │    │ Google APIs  │
            │   (Cache)    │    │  (External)  │
            └──────────────┘    └──────────────┘
```

## Core Components

### 1. Main Plugin (`main.ts`)

**Responsibility**: Plugin lifecycle management

```typescript
class GoogleCalendarTimelinePlugin extends Plugin {
    - onload(): Initialize services, register commands
    - onunload(): Cleanup resources
    - loadSettings(): Load user preferences
    - saveSettings(): Persist configuration
}
```

**Key Responsibilities**:

- Plugin initialization and teardown
- Service instantiation and dependency injection
- Command registration
- Event handling coordination

### 2. Authentication Module (`auth/`)

#### GoogleAuth (`GoogleAuth.ts`)

**Responsibility**: OAuth 2.0 flow management

```typescript
interface IGoogleAuth {
  login(): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string>;
  isAuthenticated(): boolean;
  refreshToken(): Promise<string>;
}
```

**Flow**:

1. User initiates login
2. Open OAuth consent screen
3. Handle OAuth callback
4. Store tokens securely
5. Manage token refresh

#### TokenManager (`TokenManager.ts`)

**Responsibility**: Secure token storage and retrieval

```typescript
interface ITokenManager {
  saveToken(token: OAuthToken): Promise<void>;
  getToken(): Promise<OAuthToken | null>;
  clearToken(): Promise<void>;
  isTokenExpired(token: OAuthToken): boolean;
}
```

**Security Features**:

- Encrypted storage using Obsidian's API
- Automatic token expiration checks
- Secure token refresh mechanism

### 3. API Layer (`api/`)

#### CalendarAPI (`CalendarAPI.ts`)

**Responsibility**: Google Calendar API wrapper

```typescript
interface ICalendarAPI {
  listCalendars(): Promise<Calendar[]>;
  listEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<CalendarEvent[]>;
  getEvent(eventId: string): Promise<CalendarEvent>;
  // Future: createEvent, updateEvent, deleteEvent
}
```

**Features**:

- Type-safe API calls
- Error handling and retry logic
- Rate limiting
- Request batching for performance

### 4. UI Components (`ui/`)

#### Timeline (`Timeline.ts`)

**Responsibility**: Timeline visualization

```typescript
class TimelineView extends ItemView {
    - render(): void
    - updateEvents(events: CalendarEvent[]): void
    - navigateToDate(date: Date): void
    - handleEventClick(event: CalendarEvent): void
}
```

**Integration**:

- Uses vis-timeline library
- Custom CSS for Obsidian theme matching
- Responsive design
- Interactive event handling

#### SettingsTab (`SettingsTab.ts`)

**Responsibility**: Plugin configuration UI

```typescript
class SettingsTab extends PluginSettingTab {
    display(): void {
        // Render settings UI
        - Google account connection
        - Calendar selection
        - Sync interval
        - Note template
        - Display preferences
    }
}
```

#### EventModal (`EventModal.ts`)

**Responsibility**: Event details and note preview

```typescript
class EventModal extends Modal {
    - displayEventDetails(event: CalendarEvent): void
    - generateNotePreview(event: CalendarEvent): string
    - createNote(): Promise<void>
}
```

### 5. Business Services (`services/`)

#### SyncService (`SyncService.ts`)

**Responsibility**: Calendar synchronization orchestration

```typescript
class SyncService {
    - startAutoSync(): void
    - stopAutoSync(): void
    - syncNow(): Promise<void>
    - syncCalendar(calendar: Calendar): Promise<void>
    - handleSyncErrors(error: Error): void
}
```

**Features**:

- Configurable sync intervals
- Background synchronization
- Conflict resolution
- Event deduplication
- Cache management

#### NoteCreator (`NoteCreator.ts`)

**Responsibility**: Generate markdown notes from events

```typescript
class NoteCreator {
    - createNote(event: CalendarEvent): Promise<TFile>
    - generateContent(event: CalendarEvent, template: string): string
    - resolvePlaceholders(template: string, event: CalendarEvent): string
    - sanitizeFilename(title: string): string
}
```

**Features**:

- Customizable templates
- Placeholder replacement
- Frontmatter generation
- File naming strategies
- Duplicate prevention

### 6. Data Models (`types/`)

#### Type Definitions (`calendar.ts`)

```typescript
interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: Attendee[];
  calendarId: string;
  colorId?: string;
  htmlLink: string;
  recurrence?: string[];
}

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
}

interface Settings {
  // Auth
  oauthToken?: OAuthToken;

  // Sync
  syncInterval: number; // minutes
  lastSyncTime?: number;

  // Display
  selectedCalendars: string[];
  useGoogleColors: boolean;
  defaultView: 'day' | 'week' | 'month';
  showPastEvents: boolean;

  // Notes
  noteTemplate: string;
  noteLocation: string;
  fileNamingStrategy: 'title' | 'date-title' | 'custom';

  // Advanced
  debugMode: boolean;
  maxEventsToSync: number;
}
```

## Data Flow

### Event Synchronization Flow

```
User Action (Manual Sync / Auto Sync)
            ↓
    SyncService.syncNow()
            ↓
    CalendarAPI.listCalendars()
            ↓
    Filter by user selection
            ↓
    For each calendar:
        CalendarAPI.listEvents()
            ↓
        Process events
            ↓
        Update local cache
            ↓
    TimelineView.updateEvents()
            ↓
    Render timeline
```

### Note Creation Flow

```
User clicks event in timeline
            ↓
    EventModal opens
            ↓
    Display event details
            ↓
    User clicks "Create Note"
            ↓
    NoteCreator.createNote(event)
            ↓
    Load note template
            ↓
    Replace placeholders
            ↓
    Generate filename
            ↓
    Check for duplicates
            ↓
    Create TFile in vault
            ↓
    Open note in editor (optional)
```

## State Management

### Plugin State

```typescript
class PluginState {
  // Authentication state
  isAuthenticated: boolean;
  currentUser?: UserInfo;

  // Sync state
  isSyncing: boolean;
  lastSyncTime?: Date;
  syncStatus: 'idle' | 'syncing' | 'error';

  // UI state
  isTimelineVisible: boolean;
  currentDate: Date;
  selectedEvent?: CalendarEvent;

  // Data state
  calendars: Calendar[];
  events: CalendarEvent[];
}
```

### State Updates

- **React to auth changes**: Update UI, trigger sync
- **React to sync completion**: Refresh timeline, update status
- **React to settings changes**: Re-render components, restart sync

## Error Handling

### Error Hierarchy

```typescript
class CalendarError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {}
}

class AuthenticationError extends CalendarError {}
class NetworkError extends CalendarError {}
class APIError extends CalendarError {}
class ValidationError extends CalendarError {}
```

### Error Recovery

1. **Network Errors**: Retry with exponential backoff
2. **Auth Errors**: Attempt token refresh, fallback to re-login
3. **API Errors**: Log error, notify user, use cached data
4. **Validation Errors**: Show user-friendly message, prevent invalid actions

## Performance Optimizations

### Caching Strategy

1. **Event Cache**: Store recent events locally
   - TTL: Based on sync interval
   - Invalidation: On manual sync or auth change

2. **Calendar List Cache**: Store calendar metadata
   - TTL: 24 hours
   - Invalidation: On settings change

3. **API Response Cache**: Cache API responses
   - Use ETags for efficient updates
   - Reduce unnecessary API calls

### Lazy Loading

- Load events on-demand for visible date range
- Paginate large event lists
- Defer non-critical UI updates

### Debouncing

- Debounce timeline navigation
- Debounce settings changes
- Batch API requests

## Security Architecture

### Threat Model

1. **Token Theft**: Mitigated by secure storage
2. **MITM Attacks**: Mitigated by HTTPS only
3. **XSS**: Mitigated by sanitizing user inputs
4. **Data Leakage**: No server-side component

### Security Measures

1. **Token Storage**: Encrypted using Obsidian's secure storage
2. **API Communication**: HTTPS only, certificate pinning
3. **Input Validation**: Sanitize all user inputs
4. **Output Encoding**: Escape markdown content
5. **Minimal Permissions**: Request only necessary OAuth scopes

## Testing Strategy

### Unit Tests

- Test individual components in isolation
- Mock external dependencies (API, storage)
- Focus on business logic and edge cases

### Integration Tests

- Test component interactions
- Test API integration with mock server
- Test data flow through system

### E2E Tests

- Test complete user workflows
- Test in actual Obsidian environment
- Test with real Google Calendar (test account)

### Test Coverage Goals

- Services: 90%+
- API Layer: 85%+
- UI Components: 70%+
- Overall: 80%+

## Deployment Architecture

### Build Process

```bash
TypeScript → ESBuild → Bundled JavaScript
     ↓
Type Checking
     ↓
Linting & Formatting
     ↓
Unit Tests
     ↓
Build Artifacts (main.js, manifest.json, styles.css)
```

### Release Process

1. Version bump in manifest.json
2. Update CHANGELOG.md
3. Create git tag
4. GitHub Actions builds and tests
5. Create GitHub release
6. Publish to Obsidian Community Plugins

## Monitoring & Logging

### Logging Levels

```typescript
enum LogLevel {
  DEBUG, // Detailed diagnostic information
  INFO, // General informational messages
  WARN, // Warning messages
  ERROR, // Error messages
}
```

### What to Log

- **Auth Events**: Login, logout, token refresh
- **Sync Events**: Start, success, failure, duration
- **API Calls**: Requests, responses, errors
- **Errors**: Full error details with stack traces
- **User Actions**: Commands executed, settings changed

### Privacy Considerations

- Never log OAuth tokens
- Never log full event details (may contain PII)
- Hash or redact sensitive information
- Allow users to disable logging

## Extensibility

### Plugin Architecture

Designed for future extensions:

- **Bi-directional sync**: Add write operations to CalendarAPI
- **Multiple providers**: Abstract ICalendarProvider interface
- **Custom views**: Pluggable view system
- **Event processors**: Pipeline for event transformation
- **Template engines**: Support multiple template formats

### Hooks & Events

```typescript
// Future extension points
interface PluginHooks {
  onBeforeSync: (calendars: Calendar[]) => void;
  onAfterSync: (events: CalendarEvent[]) => void;
  onEventClick: (event: CalendarEvent) => boolean;
  onNoteCreate: (file: TFile, event: CalendarEvent) => void;
}
```

## Dependencies

### Production Dependencies

- `obsidian`: Obsidian API
- `@googleapis/calendar`: Google Calendar API client
- `vis-timeline`: Timeline visualization
- `date-fns`: Date manipulation

### Development Dependencies

- `typescript`: Type safety
- `esbuild`: Fast bundling
- `eslint`: Code linting
- `prettier`: Code formatting
- `jest`: Testing framework
- `@types/*`: Type definitions

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Maintained by**: mehmedmaljoki
