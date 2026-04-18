import * as fs from 'fs';
import * as path from 'path';
import * as github from '@actions/github';

export interface RepoProfile {
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

type Pkg = { scripts?: Record<string, string> };

export async function generateProfile(workspace: string): Promise<RepoProfile> {
  const ecosystems = detectEcosystems(workspace);
  const commands = detectCommands(workspace, ecosystems);
  const protected_paths = detectProtectedPaths(workspace);
  const ci = detectCI(workspace);
  const working_roots = detectWorkingRoots(workspace, ecosystems);

  // Preserve existing identity fields if they exist
  const existing = loadExistingProfile(workspace);

  return {
    schema_version: 'v1',
    id: existing?.id ?? github.context.repo.repo,
    repository: existing?.repository ?? {
      owner: github.context.repo.owner,
      name: github.context.repo.repo,
      default_branch: 'main'
    },
    ecosystems,
    working_roots,
    protected_paths,
    commands,
    ...(ci ? { ci } : {}),
    ...(existing?.pull_request ? { pull_request: existing.pull_request } : {})
  };
}

function loadExistingProfile(workspace: string): Partial<RepoProfile> | null {
  const profilePath = path.join(workspace, '.agentic', 'profile.json');
  if (!fs.existsSync(profilePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as Partial<RepoProfile>;
  } catch {
    return null;
  }
}

function detectEcosystems(workspace: string): string[] {
  const indicators: Record<string, string> = {
    'package.json': 'node',
    'Cargo.toml': 'rust',
    'pyproject.toml': 'python',
    'setup.py': 'python',
    'requirements.txt': 'python',
    'go.mod': 'go',
    'pom.xml': 'java',
    'build.gradle': 'java',
    'build.gradle.kts': 'java',
    'Gemfile': 'ruby',
    '*.csproj': 'dotnet',
    '*.sln': 'dotnet'
  };

  const found: string[] = [];
  for (const [file, eco] of Object.entries(indicators)) {
    if (file.includes('*')) {
      // Glob-style check: look for any file matching the pattern in root
      const entries = fs.existsSync(workspace) ? fs.readdirSync(workspace) : [];
      const ext = file.replace('*', '');
      if (entries.some(e => e.endsWith(ext)) && !found.includes(eco)) {
        found.push(eco);
      }
    } else if (fs.existsSync(path.join(workspace, file)) && !found.includes(eco)) {
      found.push(eco);
    }
  }
  return found;
}

function detectCommands(workspace: string, ecosystems: string[]): RepoProfile['commands'] {
  const commands: RepoProfile['commands'] = {};

  if (ecosystems.includes('node')) {
    try {
      const pkg: Pkg = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf-8'));
      if (pkg.scripts?.test) commands.test = 'npm test';
      if (pkg.scripts?.lint) commands.lint = 'npm run lint';
      if (pkg.scripts?.build) commands.build = 'npm run build';
    } catch { /* ignore */ }
  }

  if (ecosystems.includes('rust')) {
    commands.test = commands.test ?? 'cargo test';
    commands.lint = commands.lint ?? 'cargo clippy -- -D warnings';
    commands.build = commands.build ?? 'cargo build';
  }

  if (ecosystems.includes('python')) {
    // Prefer pytest, but check for common alternatives
    commands.test = commands.test ?? 'pytest';
    if (fs.existsSync(path.join(workspace, 'pyproject.toml'))) {
      try {
        const content = fs.readFileSync(path.join(workspace, 'pyproject.toml'), 'utf-8');
        if (content.includes('ruff')) commands.lint = 'ruff check .';
        else if (content.includes('flake8')) commands.lint = 'flake8 .';
      } catch { /* ignore */ }
    }
    commands.lint = commands.lint ?? 'ruff check .';
  }

  if (ecosystems.includes('go')) {
    commands.test = commands.test ?? 'go test ./...';
    commands.lint = commands.lint ?? 'golangci-lint run';
    commands.build = commands.build ?? 'go build ./...';
  }

  if (ecosystems.includes('java')) {
    if (fs.existsSync(path.join(workspace, 'pom.xml'))) {
      commands.test = commands.test ?? 'mvn test';
      commands.build = commands.build ?? 'mvn package -DskipTests';
    } else {
      commands.test = commands.test ?? './gradlew test';
      commands.build = commands.build ?? './gradlew build -x test';
    }
  }

  if (ecosystems.includes('ruby')) {
    commands.test = commands.test ?? 'bundle exec rspec';
    commands.lint = commands.lint ?? 'bundle exec rubocop';
  }

  return commands;
}

function detectProtectedPaths(workspace: string): string[] {
  const paths: string[] = [
    '.github/workflows/**'
  ];

  const codeownersLocations = [
    path.join(workspace, 'CODEOWNERS'),
    path.join(workspace, '.github', 'CODEOWNERS'),
    path.join(workspace, 'docs', 'CODEOWNERS')
  ];

  for (const loc of codeownersLocations) {
    if (fs.existsSync(loc)) {
      const lines = fs.readFileSync(loc, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const pattern = trimmed.split(/\s+/)[0];
          if (pattern && !paths.includes(pattern)) {
            paths.push(pattern);
          }
        }
      }
      break; // use first CODEOWNERS found
    }
  }

  return paths;
}

function detectCI(workspace: string): RepoProfile['ci'] | undefined {
  const ghWorkflows = path.join(workspace, '.github', 'workflows');
  if (fs.existsSync(ghWorkflows)) {
    const workflows = fs.readdirSync(ghWorkflows).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    // Extract job names as potential required checks (heuristic)
    const checks: string[] = [];
    for (const wf of workflows) {
      try {
        const content = fs.readFileSync(path.join(ghWorkflows, wf), 'utf-8');
        const jobMatches = content.match(/^  (\w[\w-]+):\s*$/gm);
        if (jobMatches) {
          jobMatches.forEach(m => {
            const name = m.trim().replace(':', '');
            if (!checks.includes(name)) checks.push(name);
          });
        }
      } catch { /* ignore */ }
    }
    return {
      provider: 'github_actions',
      required_checks: checks.slice(0, 5) // cap at 5 to avoid noise
    };
  }
  return undefined;
}

function detectWorkingRoots(workspace: string, ecosystems: string[]): string[] {
  // Detect monorepo patterns
  const roots: string[] = ['.'];

  // Check for common monorepo directories
  const monoroDirs = ['packages', 'apps', 'services', 'libs', 'frontend', 'backend', 'api', 'web'];
  for (const dir of monoroDirs) {
    const dirPath = path.join(workspace, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      roots.push(dir);
    }
  }

  // If node + rust both present (like meal-planner), keep explicit roots
  if (ecosystems.includes('node') && ecosystems.includes('rust') && roots.length === 1) {
    // Frontend might be in a subdirectory
    const frontendCandidates = ['frontend', 'web', 'client', 'ui'];
    for (const candidate of frontendCandidates) {
      if (
        fs.existsSync(path.join(workspace, candidate, 'package.json')) &&
        !roots.includes(candidate)
      ) {
        roots.push(candidate);
      }
    }
  }

  return roots;
}
