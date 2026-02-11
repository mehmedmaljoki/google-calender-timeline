#!/bin/bash
# Setup script for local development

set -e

echo "🚀 Setting up Google Calendar Timeline development environment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
fi

# Create test vault directory
TEST_VAULT="$HOME/obsidian-test-vault"
echo ""
echo "📁 Creating test vault at: $TEST_VAULT"

if [ -d "$TEST_VAULT" ]; then
    echo -e "${YELLOW}⚠${NC}  Test vault already exists"
else
    mkdir -p "$TEST_VAULT"
    echo -e "${GREEN}✓${NC} Test vault created"
fi

# Create .obsidian directory
mkdir -p "$TEST_VAULT/.obsidian/plugins"

# Create plugin directory
PLUGIN_DIR="$TEST_VAULT/.obsidian/plugins/google-calendar-timeline"

# Remove old symlink if exists
if [ -L "$PLUGIN_DIR" ]; then
    echo "🔗 Removing old symlink..."
    rm "$PLUGIN_DIR"
fi

# Create symlink
echo "🔗 Creating symlink to plugin..."
ln -s "$(pwd)" "$PLUGIN_DIR"
echo -e "${GREEN}✓${NC} Symlink created"

# Create initial vault config
OBSIDIAN_CONFIG="$TEST_VAULT/.obsidian/community-plugins.json"
if [ ! -f "$OBSIDIAN_CONFIG" ]; then
    echo "⚙️  Creating Obsidian config..."
    echo '["google-calendar-timeline"]' > "$OBSIDIAN_CONFIG"
    echo -e "${GREEN}✓${NC} Config created"
fi

# Create a welcome note
WELCOME_NOTE="$TEST_VAULT/Welcome.md"
if [ ! -f "$WELCOME_NOTE" ]; then
    cat > "$WELCOME_NOTE" << 'EOF'
# Welcome to Google Calendar Timeline Development

This is your test vault for developing the Google Calendar Timeline plugin.

## Quick Start

1. Enable the plugin in Settings → Community Plugins
2. Connect your Google Calendar in plugin settings
3. Use Command Palette (`Cmd+P`) → "Open timeline"

## Development Workflow

- Plugin files are in: `~/dev/google-calender-timeline`
- After making changes, reload Obsidian: `Cmd+R`
- Open Developer Console: `Cmd+Option+I`

## Testing Commands

Try these via Command Palette:
- `Google Calendar: Open timeline`
- `Google Calendar: Sync now`
- `Google Calendar: Connect account`

Happy coding! 🚀
EOF
    echo -e "${GREEN}✓${NC} Welcome note created"
fi

# Build the plugin
echo ""
echo "🔨 Building plugin..."
npm run build
echo -e "${GREEN}✓${NC} Plugin built"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "  ${BLUE}1.${NC} Start development mode:"
echo "     ${YELLOW}npm run dev${NC}"
echo ""
echo -e "  ${BLUE}2.${NC} Open Obsidian with your test vault:"
echo "     ${YELLOW}open -a Obsidian $TEST_VAULT${NC}"
echo ""
echo -e "  ${BLUE}3.${NC} In Obsidian:"
echo "     - Go to Settings → Community Plugins"
echo "     - Disable Safe Mode"
echo "     - Enable 'Google Calendar Timeline'"
echo ""
echo -e "  ${BLUE}4.${NC} After making changes:"
echo "     - Press ${YELLOW}Cmd+R${NC} in Obsidian to reload"
echo "     - Press ${YELLOW}Cmd+Option+I${NC} for Developer Tools"
echo ""
echo "Test vault location: ${YELLOW}$TEST_VAULT${NC}"
echo ""
