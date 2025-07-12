# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a TypeScript monorepo implementing an MCP (Model Context Protocol) server for uploading images to GitHub repositories. The main functionality enables AI assistants to create GitHub PR comments with working image previews.

## Common Development Commands

### Setup and Dependencies
```bash
# Install dependencies (uses pnpm)
pnpm install

# Ensure correct Node version (v24.3.0)
# Project uses Volta for version management
```

### Development
```bash
# Run development mode with hot reload
pnpm dev

# Run MCP inspector for debugging
cd apps/gh-image && pnpm inspector
```

### Build and Quality Checks
```bash
# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm check-types

# Run tests (Vitest configured but no tests yet)
pnpm test
```

## Architecture

### Monorepo Structure
- **apps/** - Contains applications (currently only `gh-image`)
  - **gh-image/** - MCP server for GitHub image uploads
- **packages/** - Shared packages (currently empty)
- Uses Turbo for build orchestration
- pnpm workspaces for dependency management

### MCP Server Architecture (apps/gh-image)
- **src/index.ts** - Entry point, initializes MCP server
- **src/utils/registerCommitAndUploadImage.ts** - Main tool registration
- **src/tools/commit-and-upload-image.ts** - Core functionality for image upload
- Uses `@modelcontextprotocol/sdk` for MCP implementation
- Leverages Git commands to commit images and generate GitHub raw URLs

### Key Technical Decisions
- TypeScript with strictest configuration (ES2022 target)
- Biome for consistent code formatting and linting
- tsup for building with watch mode support
- No external state management - tools are stateless functions
- Direct Git command execution for repository operations

## Important Context

### MCP Tool Implementation
The `commit-and-upload-image` tool:
1. Accepts base64-encoded image data
2. Commits the image to a Git repository
3. Returns a GitHub raw URL for preview in PR comments
4. Handles automatic filename generation and path creation

### Code Style
- Double quotes for strings
- 2-space indentation
- Biome recommended rules enforced
- TypeScript strict mode enabled
- Organize imports automatically

### Testing Strategy
Vitest is configured but no tests exist yet. When adding tests:
- Place test files adjacent to source files with `.test.ts` extension
- Run individual tests with: `pnpm test <test-file-pattern>`