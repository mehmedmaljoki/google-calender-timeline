# 🚀 Deployment Guide - Obsidian Community Plugins

## Marketplace Deployment Checklist

### ✅ Pre-Deployment Verification

Before submitting to the Obsidian Community Plugins marketplace:

- [x] **Code Complete**: All features implemented
- [x] **Build Success**: `npm run build` completes without errors
- [x] **Documentation**: README, INSTALLATION, ARCHITECTURE complete
- [x] **manifest.json**: Properly configured with correct version
- [x] **styles.css**: All styling included
- [x] **LICENSE**: MIT license included
- [x] **.gitignore**: Excludes node_modules, dist, build files

### 📋 Required Files for Release

Ensure these files are in your repository root:

```
google-calendar-timeline/
├── main.js           ← Build output (generated)
├── manifest.json     ← Plugin metadata
├── styles.css        ← Plugin styles
├── README.md         ← Main documentation
├── LICENSE           ← License file
└── versions.json     ← Version history
```

---

## 🎯 Step-by-Step Deployment

### Step 1: Final Build

```powershell
cd c:\development\projects\google-calender-timeline

# Install dependencies (if not done)
npm install

# Run final build
npm run build

# Verify output
Test-Path main.js  # Should return True
```

### Step 2: Update Version

Update version in **3 locations**:

**1. manifest.json:**

```json
{
	"version": "1.0.0"
}
```

**2. package.json:**

```json
{
	"version": "1.0.0"
}
```

**3. versions.json:**

```json
{
	"1.0.0": "1.4.0"
}
```

### Step 3: Commit and Push

```powershell
git add .
git commit -m "Release v1.0.0"
git push origin main
```

### Step 4: Create GitHub Release

1. Go to: `https://github.com/YOUR_USERNAME/google-calendar-timeline/releases`
2. Click "Create a new release"
3. Fill in:
   - **Tag version**: `1.0.0`
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**:

     ```markdown
     # Google Calendar Timeline v1.0.0

     ## 🎉 Initial Release

     ### Features

     - ✅ Google Calendar OAuth 2.0 integration
     - 📅 Interactive timeline visualization
     - 📝 Create Obsidian notes from calendar events
     - 🔄 Auto-sync with configurable intervals
     - 🎨 Multi-calendar support with original colors
     - ⚙️ Customizable note templates
     - 🔧 Flexible settings and configuration

     ### Installation

     See [INSTALLATION.md](docs/INSTALLATION.md) for setup instructions.

     ### Known Issues

     - OAuth credentials must be manually configured

     ### Requirements

     - Obsidian 1.4.0+
     - Google Calendar API access
     ```

4. **Attach files** (upload these 3 files):
   - `main.js`
   - `manifest.json`
   - `styles.css`

5. Click "Publish release"

### Step 5: Submit to Community Plugins

1. **Fork the Obsidian Release Repository**:
   - Go to: https://github.com/obsidianmd/obsidian-releases
   - Click "Fork"

2. **Add your plugin**:

   Edit `community-plugins.json`:

   ```json
   {
   	"id": "google-calendar-timeline",
   	"name": "Google Calendar Timeline",
   	"author": "YOUR_NAME",
   	"description": "Sync Google Calendar events and visualize them in an interactive timeline. Create notes directly from calendar events.",
   	"repo": "YOUR_USERNAME/google-calendar-timeline"
   }
   ```

3. **Create Pull Request**:
   - Title: `Add Google Calendar Timeline plugin`
   - Description:

     ```markdown
     ## Plugin Information

     - **Name**: Google Calendar Timeline
     - **Author**: YOUR_NAME
     - **Description**: Sync Google Calendar events and visualize them in an interactive timeline. Create notes directly from calendar events.
     - **Repository**: https://github.com/YOUR_USERNAME/google-calendar-timeline
     - **Initial Release**: v1.0.0

     ## Checklist

     - [x] Plugin builds successfully
     - [x] All required files included in release
     - [x] Documentation complete
     - [x] License included (MIT)
     - [x] manifest.json properly configured
     - [x] Plugin follows Obsidian guidelines
     - [x] No API keys hardcoded
     - [x] Privacy-respecting (no external data collection)

     ## Additional Notes

     This plugin provides Google Calendar integration with OAuth 2.0 authentication. Users must configure their own Google OAuth credentials for security reasons.
     ```

4. **Submit PR** and wait for review

---

## 📝 Obsidian Plugin Guidelines Compliance

### ✅ Required Compliance

- **No telemetry**: ✅ No data collection
- **No ads**: ✅ No advertisements
- **Open source**: ✅ MIT License
- **API usage**: ✅ Only Google Calendar API (user must provide credentials)
- **No bundled API keys**: ✅ Users configure their own
- **Respects user privacy**: ✅ All data stored locally
- **No external services**: ✅ Only Google Calendar (user-controlled)

### 📄 Required Documentation

- [x] **README.md**: Clear description and features
- [x] **Installation guide**: docs/INSTALLATION.md
- [x] **manifest.json**: Proper metadata
- [x] **LICENSE**: MIT License included
- [x] **CHANGELOG.md**: Version history
- [x] **SECURITY.md**: Security policy
- [x] **CONTRIBUTING.md**: Contribution guidelines

---

## 🔄 Update Process (Future Releases)

### For Version Updates (e.g., 1.0.0 → 1.1.0):

1. **Make changes** in code
2. **Update version** in 3 files:
   - `manifest.json`
   - `package.json`
   - Add entry to `versions.json`
3. **Update CHANGELOG.md**:

   ```markdown
   ## [1.1.0] - 2024-XX-XX

   ### Added

   - New feature X

   ### Fixed

   - Bug fix Y
   ```

4. **Build**: `npm run build`
5. **Commit and push**
6. **Create new GitHub release** with tag `1.1.0`
7. **Attach files**: main.js, manifest.json, styles.css
8. **Community plugins auto-update** (no new PR needed after initial approval)

---

## 🧪 Testing Before Release

### Manual Testing Checklist

- [ ] **Authentication**: Connect to Google Calendar works
- [ ] **Sync**: Manual and auto-sync functioning
- [ ] **Timeline**: Events display correctly
- [ ] **Event Modal**: Opens and shows details
- [ ] **Note Creation**: Creates notes with template
- [ ] **Settings**: All settings save and apply
- [ ] **Commands**: All commands execute
- [ ] **Ribbon Icon**: Opens timeline view
- [ ] **Error Handling**: Graceful error messages
- [ ] **Performance**: Smooth with 100+ events

### Test in Clean Vault

1. Create new test vault
2. Install plugin manually
3. Test complete workflow:
   - Authentication
   - Sync
   - View timeline
   - Create notes
   - Adjust settings
4. Check console for errors (Ctrl+Shift+I)

---

## 📊 Post-Release

### Monitor Issues

- Watch GitHub issues: https://github.com/YOUR_USERNAME/google-calendar-timeline/issues
- Respond to user questions
- Fix critical bugs in patch releases

### Promote Your Plugin

- Share on Obsidian Forum: https://forum.obsidian.md/
- Post on Reddit: r/ObsidianMD
- Tweet with #ObsidianMD
- Update plugin list: https://obsidian-plugin-stats.vercel.app/

### Update Documentation

- Add FAQ section for common questions
- Create video tutorial (optional)
- Write blog post about plugin (optional)

---

## 🛠️ Development vs Production

### Development Build (with source maps):

```powershell
npm run dev
```

### Production Build (minified):

```powershell
npm run build
```

**Always use production build for releases!**

---

## 🔒 Security Considerations

### OAuth Credentials

**⚠️ IMPORTANT**: Never commit actual OAuth credentials!

The plugin uses placeholder values:

```typescript
private readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
private readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
```

**User Setup Required**:

1. Users create their own Google Cloud Project
2. Enable Google Calendar API
3. Create OAuth 2.0 Desktop credentials
4. Replace placeholders in source code
5. Rebuild plugin

**For Security**:

- Credentials stay on user's machine
- No central authentication server
- Full user control

---

## 📞 Support Channels

After release, monitor these channels:

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community support
- **Obsidian Forum**: Plugin-specific thread
- **Obsidian Discord**: #plugin-dev and #plugin-showcase channels

---

## ✨ Success Criteria

Your plugin is ready when:

- ✅ Builds without errors
- ✅ All features working
- ✅ Documentation complete
- ✅ GitHub release created
- ✅ Community plugin PR submitted
- ✅ Test vault verification passed

---

## 🎉 Congratulations!

You've successfully deployed your Obsidian plugin! 🚀

### Next Steps:

1. ⏳ Wait for Obsidian team review (usually 1-2 weeks)
2. 📬 Respond to any review comments
3. ✅ Plugin gets approved and listed
4. 🎊 Users can install directly from Obsidian!

---

## 📚 Additional Resources

- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Plugin Review Process](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)

---

**Last Updated**: 2024-01-10  
**Plugin Version**: 1.0.0  
**Status**: ✅ Ready for Deployment
