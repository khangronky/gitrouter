# GitRouter

GitRouter is an intelligent pull request routing and management platform that automates reviewer assignments based on customizable rules. It integrates seamlessly with GitHub, Slack, and Jira to streamline your team's code review workflow.

## Core Features

- **Automated PR Routing** - Automatically assign reviewers to pull requests based on file patterns, branch names, authors, or time windows
- **Rules Builder** - Create and manage routing rules with an intuitive visual interface
- **Dashboard Analytics** - Track PR metrics including review latency, reviewer workload, bottlenecks, and stale PRs
- **Multi-Integration Support** - Connect with GitHub for PR management, Slack for notifications, and Jira for issue tracking
- **Organization Management** - Manage teams, reviewers, and repositories across your organization
- **Escalation Policies** - Set up automated escalations when PRs remain unreviewed

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) + [TanStack Query](https://tanstack.com/query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

1. **Node.js** (v20 or later recommended)
2. **Bun** - Install from [bun.sh](https://bun.sh/)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
3. **Docker Desktop** - Required for running the local Supabase database. Download from [docker.com](https://www.docker.com/products/docker-desktop/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/gitrouter.git
   cd gitrouter
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the local Supabase instance (make sure Docker Desktop is running):
   ```bash
   bun sb:start
   ```

4. After Supabase starts, you'll see output containing connection details (can be re-printed with `bun sb:status`).
Create a `.env.local` file based on `.env.example` and configure the following variables from the Supabase output:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<Studio URL from `bun sb:status` output>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key from `bun sb:status` output>
   SUPABASE_SECRET_KEY=<Secret key from `bun sb:status` output>
   ```

5. Configure additional environment variables for integrations:
   ```env
   # GitHub App credentials
   GITHUB_APP_ID=
   GITHUB_APP_SLUG=
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   GITHUB_APP_PRIVATE_KEY=
   GITHUB_WEBHOOK_SECRET=

   # Slack integration
   SLACK_CLIENT_ID=
   SLACK_CLIENT_SECRET=
   SLACK_SIGNING_SECRET=

   # Jira integration
   JIRA_CLIENT_ID=
   JIRA_CLIENT_SECRET=

   # Application settings
   CRON_SECRET=
   ENCRYPTION_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

6. Run the development server:
   ```bash
   bun dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

8. For quickstart, you can use the following commands:
   ```bash
   bun devx
   ```
   This will start the development server and local Supabase instance.

## Key Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun sb:start` | Start local Supabase instance |
| `bun sb:stop` | Stop local Supabase instance |
| `bun sb:reset` | Reset local database (runs migrations) |
| `bun sb:typegen` | Generate TypeScript types from database schema |
| `bun format-and-lint:fix` | Format and lint code with Biome |

## License

MIT
