# GitHub Repository Manager

A command-line application built with Node.js and TypeScript to manage your GitHub repositories. You can change repository visibility (public/private) and delete repositories through an interactive menu.

## Features

- 🔐 **Change Repository Visibility**: Convert repositories between public and private
- 🗑️ **Delete Repositories**: Safely delete repositories with confirmation
- 📋 **List Repositories**: View all your repositories with details
- 🎯 **Interactive Menu**: Easy-to-use command-line interface
- ✅ **Batch Operations**: Select multiple repositories for bulk actions
- 🔒 **Safe Operations**: Confirmation prompts for destructive actions

## Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- GitHub Personal Access Token

## Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd github-repo-actions
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your GitHub token:
   ```
   GITHUB_TOKEN=your_github_personal_access_token_here
   ```

## Usage

Run the application:

```bash
pnpm start
```

### Menu Options

1. **👁️ Change repository visibility**

   - Choose target visibility (public or private)
   - Select repositories to change
   - Confirm the action

2. **🗑️ Delete repositories**

   - Select repositories to delete
   - Type "DELETE" to confirm
   - Repositories will be permanently deleted

3. **📋 List all repositories**

   - View all your repositories with visibility, language, and size information

4. **🚪 Exit**
   - Quit the application

## Development

Run in development mode with auto-restart:

```bash
pnpm dev
```

Build the TypeScript code:

```bash
pnpm build
```
