# GitHub Copilot Instructions for BliKVM Matrix Client

## Project Overview

This is a modern Vue.js web client for BliKVM - an open-source KVM (Keyboard, Video, Mouse) over IP solution. The client provides a comprehensive web interface for remote server management with real-time video streaming, keyboard/mouse control, virtual media mounting, and system monitoring.

**Version**: 2.2.0-alpha  
**License**: GPL-3.0

## Technology Stack

### Core Framework

- **Vue 3** with Composition API - Use `<script setup>` syntax
- **Vuetify 3** - Material Design components (auto-imported)
- **Pinia** - State management with persistence
- **Vue Router 4** - Client-side routing with auto-generated routes

### Build & Development

- **Vite** - Fast build tool and dev server (runs on port 10005 with HTTPS)
- **unplugin-auto-import** - Auto-imports Vue APIs (ref, computed, watch, etc.)
- **unplugin-vue-components** - Auto-imports Vuetify components
- **ESLint** - Code linting with Vue plugin
- **Prettier** - Code formatting

### Key Libraries

- **WebRTC** - Real-time video/audio streaming via Janus Gateway
- **@xterm/xterm** - Terminal emulator
- **Axios** - HTTP client (configured in `src/utils/http.js`)
- **Chart.js** - Data visualization
- **Tesseract.js** - OCR text extraction
- **@casl/ability** - Role-based access control
- **@uppy/tus** - Resumable file uploads

## Code Organization

```
src/
├── components/       # Vue components (auto-imported)
│   ├── App*.vue     # Main application components
│   ├── Settings*.vue # Configuration components
│   ├── dialog/      # Modal dialogs
│   └── shared/      # Reusable UI components
├── composables/     # Vue composition functions (reusable logic)
├── stores/          # Pinia stores (state management)
├── pages/           # Route pages (auto-generated routes)
├── layouts/         # Layout templates
├── utils/           # Utility functions
│   ├── http.js      # Axios HTTP client
│   ├── websocket.js # WebSocket utilities
│   └── locales/     # i18n translations (en.json, zh.json)
└── styles/          # Global styles and themes
```

## Development Workflow

### Prerequisites

- Node.js 18 or higher (no specific version pinned in package.json)
- HTTPS development requires `cert.pem` and `key.pem` in project root

### Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (https://localhost:10005)
npm run build        # Production build
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
```

### Development Server

- Port: 10005 (HTTPS only - required for WebRTC)
- Auto-reloads on file changes
- TUS proxy configured for file uploads at `/tus`

## Code Style & Conventions

### Vue Components

- **Always use `<script setup>` syntax** for new components
- Auto-imported: Vue APIs (ref, computed, watch), Vuetify components, custom components
- Use Composition API patterns - prefer composables over mixins
- Component naming: PascalCase for file names (e.g., `AppKVM.vue`)

### Formatting Rules (Prettier)

- Single quotes for strings
- Semicolons required
- Trailing commas (ES5 style)
- Print width: 100 characters
- Tab width: 2 spaces
- Arrow function parens: always
- Indent script and style in `.vue` files

### ESLint Configuration

- Vue plugin enabled with recommended rules
- Auto-import globals configured in `.eslintrc-auto-import.json`
- Run `npm run lint` before committing

### State Management

- Use **Pinia stores** for global state (see `src/stores/stores.js`)
- Stores persist using `pinia-plugin-persistedstate`
- Use **composables** for component-specific logic
- Store files: `src/stores/*.js`
- Composable files: `src/composables/use*.js`

### API Communication

- HTTP: Use the configured Axios instance from `src/utils/http.js`
- WebSocket: Use utilities in `src/utils/websocket.js`
- WebRTC: Integration with Janus Gateway for video/audio streaming

### Naming Conventions

- Composables: `use*.js` (e.g., `useKeyboard.js`, `useVideo.js`)
- Stores: Plain descriptive names (e.g., `stores.js`, `useVpnStore.js`)
- Components: PascalCase (e.g., `AppToolbar.vue`, `SettingsKVM.vue`)
- Utils: camelCase (e.g., `http.js`, `websocket.js`)

## Architecture Patterns

### Composables Pattern

Composables encapsulate reusable logic and are the preferred way to share functionality:

- Authentication: `useAuthentication.js`
- KVM operations: `useAppKVMVideo.js`, `useKeyboard-new.js`, `useMouse.js`
- System info: `useSystemInfo.js`, `useTemperature.js`
- Media: `useVideo.js`, `useSerialTerminal.js`, `useVirtualMedia.js`

### Component Structure

```vue
<template>
  <!-- Use Vuetify components (auto-imported) -->
  <v-container>
    <v-btn @click="handleClick">Action</v-btn>
  </v-container>
</template>

<script setup>
  // Auto-imported: ref, computed, watch, onMounted, etc.
  // Auto-imported: Vuetify components
  // Manual imports only for composables, stores, utils

  import { useMyComposable } from '@/composables/useMyComposable';

  const myData = ref('');
  const myComputed = computed(() => myData.value.toUpperCase());

  const handleClick = () => {
    // Implementation
  };
</script>

<style scoped lang="scss">
  /* Component-specific styles */
</style>
```

### Routing

- Routes auto-generated from `src/pages/*.vue` files using `unplugin-vue-router`
- Layouts managed by `vite-plugin-vue-layouts`
- Access route params via `useRoute()` (auto-imported)
- Navigate via `useRouter()` (auto-imported)

### Internationalization

- Vue i18n for multi-language support
- Translation files: `src/utils/locales/en.json`, `src/utils/locales/zh.json`
- Use `$t('key')` in templates for translations

## Testing Practices

Currently, there are no automated tests in this repository. When adding tests in the future:

- Follow Vue 3 testing best practices
- Use component testing for Vue components
- Use unit tests for utilities and composables

## Important Constraints

### Security

- **Always use HTTPS** - Required for WebRTC features
- Authentication via JWT with optional 2FA
- Role-based access control using CASL
- Never commit secrets or credentials
- Input validation on server side

### Browser Compatibility

- Target modern browsers: Chrome 90+, Firefox 88+, Edge 90+
- WebRTC required - Safari 14+ supported (Safari 15+ has significantly improved WebRTC capabilities)
- Modern JavaScript features are acceptable (ES2020+)

### Performance Considerations

- Optimized for LAN deployment with low latency
- Video streaming is bandwidth-intensive
- State persistence can impact startup time
- Lazy load heavy components when possible

### Build Configuration

- Base path is relative (`./`) for flexible deployment
- Build includes git commit hash and timestamp
- Sass uses modern compiler API
- Auto-import reduces bundle size with tree-shaking

## Special Notes

### WebRTC Integration

- Janus Gateway integration for video/audio streaming
- WebRTC Adapter for cross-browser compatibility
- Connection management in `useConnection.js`

### File Uploads

- TUS protocol for resumable uploads
- Uppy components for UI
- Proxy configured in Vite config for dev server

### Virtual Keyboard

- `simple-keyboard` library with multiple layouts
- Touch and mouse input handling
- Accurate cursor tracking for dual input sources

### Terminal Emulation

- @xterm/xterm for in-browser terminal
- Serial communication via WebSocket
- Terminal fits to container using addon

### OCR Text Extraction

- Tesseract.js for screen text recognition
- Configured in `useExtractText.js` composable

## When Contributing

1. Follow existing code patterns and structure
2. Run `npm run lint` and `npm run format` before committing
3. Use meaningful commit messages (see README.md for commit guidelines)
4. Test in Chrome, Firefox, and Edge if possible
5. Ensure HTTPS works (cert.pem and key.pem required)
6. Document new composables and complex logic
7. Keep bundle size in mind - lazy load when appropriate

## Git Workflow

Commit message format:

```
<type>: <subject>
```

Types: `feature` or `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `merge`, `revert`, `build`, `chore`

Note: This project accepts both `feature` and `feat` for new features (see README.md)

Example: `feat: add virtual keyboard support for mobile devices`

## Additional Resources

- Project README: `/README.md`
- Package info: `/package.json`
- Vite config: `/vite.config.mjs`
- Main entry: `/src/main.js`
- Store definitions: `/src/stores/stores.js`
