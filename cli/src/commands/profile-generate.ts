import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

interface RepoProfile {
  schema_version: string;
  id: string;
  repository: {
    owner: string;
    name: string;
    default_branch?: string;
  };
  ecosystems: string[];
  working_roots: string[];
  protected_paths: string[];
  commands: {
    test?: string;
    lint?: string;
    build?: string;
  };
  ci?: {
    provider?: string;
    required_checks?: string[];
  };
  pull_request?: {
    provider?: string;
    required_approvals?: number;
  };
}

async function detectEcosystems(repoRoot: string): Promise<string[]> {
  const ecosystems: string[] = [];
  const indicators: Record<string, string> = {
    'package.json': 'node',
    'Cargo.toml': 'rust',
    'pyproject.toml': 'python',
    'setup.py': 'python',
    'go.mod': 'go',
    'pom.xml': 'java',
    'build.gradle': 'java',
    'Gemfile': 'ruby'
  };

  for (const [file, ecosystem] of Object.entries(indicators)) {
    if (await fs.pathExists(path.join(repoRoot, file))) {
      if (!ecosystems.includes(ecosystem)) {
        ecosystems.push(ecosystem);
      }
    }
  }
  return ecosystems;
}

async function detectCommands(repoRoot: string, ecosystems: string[]): Promise<RepoProfile['commands']> {
  const commands: RepoProfile['commands'] = {};

  if (ecosystems.includes('node')) {
    const pkg = await fs.readJson(path.join(repoRoot, 'package.json')).catch(() => null);
    if (pkg?.scripts) {
      if (pkg.scripts.test) commands.test = 'npm test';
      if (pkg.scripts.lint) commands.lint = 'npm run lint';
      if (pkg.scripts.build) commands.build = 'npm run build';
    }
  }
  if (ecosystems.includes('rust')) {
    commands.test = commands.test ?? 'cargo test';
    commands.lint = commands.lint ?? 'cargo clippy';
    commands.build = commands.build ?? 'cargo build';
  }
  if (ecosystems.includes('python')) {
    commands.test = commands.test ?? 'pytest';
    commands.lint = commands.lint ?? 'ruff check .';
  }
  if (ecosystems.includes('go')) {
    commands.test = commands.test ?? 'go test ./...';
    commands.lint = commands.lint ?? 'golangci-lint run';
    commands.build = commands.build ?? 'go build ./...';
  }

  return commands;
}

async function detectProtectedPaths(repoRoot: string): Promise<string[]> {
  const protected_paths: string[] = [];
  const codeownersPath = path.join(repoRoot, '.github', 'CODEOWNERS');
  if (await fs.pathExists(codeownersPath)) {
    const lines = (await fs.readFile(codeownersPath, 'utf-8')).split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const pattern = trimmed.split(/\s+/)[0];
        if (pattern) protected_paths.push(pattern);
      }
    }
  }
  return protected_paths;
}

async function detectCIConfig(repoRoot: string): Promise<RepoProfile['ci'] | undefined> {
  const ghWorkflowsDir = path.join(repoRoot, '.github', 'workflows');
  if (await fs.pathExists(ghWorkflowsDir)) {
    return { provider: 'github_actions', required_checks: [] };
  }
  return undefined;
}

export const profileCommand = new Command('profile')
  .description('Manage the .agentic/profile.json for this repository')
  .option('--generate', 'Auto-discover repo context and write/update .agentic/profile.json')
  .option('--dry-run', 'Print discovered values without writing files')
  .action(async (options) => {
    const repoRoot = process.cwd();
    const profilePath = path.join(repoRoot, '.agentic', 'profile.json');

    if (!options.generate) {
      console.log(chalk.yellow('Tip: Run `agentic profile --generate` to auto-discover your repo context.'));
      if (await fs.pathExists(profilePath)) {
        const profile = await fs.readJson(profilePath);
        console.log(JSON.stringify(profile, null, 2));
      } else {
        console.log(chalk.red('No .agentic/profile.json found. Run `agentic init` first.'));
      }
      return;
    }

    console.log(chalk.bold('Discovering repository context...'));

    const ecosystems = await detectEcosystems(repoRoot);
    const commands = await detectCommands(repoRoot, ecosystems);
    const protected_paths = await detectProtectedPaths(repoRoot);
    const ci = await detectCIConfig(repoRoot);

    const repoName = path.basename(repoRoot);

    let existing: Partial<RepoProfile> = {};
    if (await fs.pathExists(profilePath)) {
      existing = await fs.readJson(profilePath);
    }

    const profile: RepoProfile = {
      schema_version: 'v1',
      id: existing.id ?? repoName,
      repository: existing.repository ?? {
        owner: '<github-org>',
        name: repoName,
        default_branch: 'main'
      },
      ecosystems,
      working_roots: existing.working_roots ?? ['.'],
      protected_paths,
      commands,
      ...(ci ? { ci } : {}),
      ...(existing.pull_request ? { pull_request: existing.pull_request } : {})
    };

    if (options.dryRun) {
      console.log(chalk.yellow('[dry-run] Would write to .agentic/profile.json:'));
      console.log(JSON.stringify(profile, null, 2));
      return;
    }

    await fs.ensureDir(path.join(repoRoot, '.agentic'));
    await fs.writeJson(profilePath, profile, { spaces: 2 });

    console.log(chalk.green(`✓ Updated .agentic/profile.json`));
    console.log(`  Ecosystems detected: ${ecosystems.join(', ') || 'none'}`);
    console.log(`  Commands: ${JSON.stringify(commands)}`);
    console.log(`  Protected paths from CODEOWNERS: ${protected_paths.length}`);
    console.log('');
    console.log(chalk.bold('Review .agentic/profile.json and adjust any values before committing.'));
  });
