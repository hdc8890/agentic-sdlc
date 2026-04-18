import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';
import { validateAgenticDir } from './validate';
import { generateProfile } from './profile';

async function run(): Promise<void> {
  try {
    const command = core.getInput('command', { required: false }) || 'validate';
    const autonomyLevel = core.getInput('autonomy_level', { required: false }) || 'semi_autonomous';
    const repoToken = core.getInput('repo_token', { required: false });

    // The workspace is always GITHUB_WORKSPACE in a real action run
    const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
    // Schemas ship with this action at GITHUB_ACTION_PATH/contracts/v1/
    const actionPath = process.env.GITHUB_ACTION_PATH ?? path.join(__dirname, '..', '..');
    const contractsDir = path.join(actionPath, 'contracts', 'v1');

    core.info(`Command: ${command}`);
    core.info(`Workspace: ${workspace}`);
    core.info(`Contracts: ${contractsDir}`);

    switch (command) {
      case 'validate':
        await runValidate(workspace, contractsDir);
        break;
      case 'profile-generate':
        await runProfileGenerate(workspace, contractsDir, autonomyLevel);
        break;
      case 'onboard':
        await runOnboard(workspace, contractsDir, autonomyLevel, repoToken);
        break;
      default:
        core.setFailed(`Unknown command: ${command}. Valid commands: validate, profile-generate, onboard`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(`Action failed: ${message}`);
  }
}

async function runValidate(workspace: string, contractsDir: string): Promise<void> {
  core.startGroup('Validating .agentic/ configuration');
  const results = await validateAgenticDir(workspace, contractsDir);

  let allPassed = true;
  for (const result of results) {
    if (result.skipped) {
      core.warning(`⚠  ${result.file} — not found (optional)`);
    } else if (result.valid) {
      core.info(`✓  ${result.file}`);
    } else {
      allPassed = false;
      core.error(`✗  ${result.file}`);
      for (const err of result.errors) {
        core.error(`   ${err}`);
      }
    }
  }
  core.endGroup();

  core.setOutput('validation_passed', String(allPassed));

  if (!allPassed) {
    core.setFailed(
      'Validation failed. Fix the errors above and push again.\n' +
      'Run `agentic validate` locally to reproduce.'
    );
  } else {
    core.info('All .agentic/ files are valid.');
  }
}

async function runProfileGenerate(workspace: string, contractsDir: string, autonomyLevel: string): Promise<void> {
  core.startGroup('Generating .agentic/profile.json');
  const agenticDir = path.join(workspace, '.agentic');

  if (!fs.existsSync(agenticDir)) {
    core.info('No .agentic/ directory found — creating it with defaults');
    fs.mkdirSync(agenticDir, { recursive: true });

    const repoName = path.basename(workspace);
    const starterProfile = {
      schema_version: 'v1',
      id: repoName,
      repository: { owner: github.context.repo.owner, name: github.context.repo.repo, default_branch: 'main' },
      ecosystems: [],
      working_roots: ['.'],
      protected_paths: [],
      commands: {}
    };
    const starterPolicy = {
      schema_version: 'v1',
      autonomy_level: autonomyLevel,
      require_human_review_on: ['protected_path_changes', 'security_related', 'dependency_changes'],
      auto_merge: false,
      max_execution_steps: 10
    };
    fs.writeFileSync(path.join(agenticDir, 'profile.json'), JSON.stringify(starterProfile, null, 2));
    fs.writeFileSync(path.join(agenticDir, 'policy.json'), JSON.stringify(starterPolicy, null, 2));
    core.info('Created starter .agentic/profile.json and policy.json');
  }

  const profile = await generateProfile(workspace);
  const profilePath = path.join(agenticDir, 'profile.json');
  fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  core.endGroup();

  core.info(`✓ Wrote ${profilePath}`);
  core.info(`  Ecosystems: ${profile.ecosystems.join(', ') || '(none detected)'}`);
  core.info(`  Commands: ${JSON.stringify(profile.commands)}`);
  core.info(`  Protected paths: ${profile.protected_paths.length} entries`);

  core.setOutput('profile_generated', 'true');
  core.setOutput('profile_path', profilePath);

  // Validate what we wrote
  await runValidate(workspace, contractsDir);
}

async function runOnboard(workspace: string, contractsDir: string, autonomyLevel: string, repoToken: string): Promise<void> {
  // Generate profile first
  await runProfileGenerate(workspace, contractsDir, autonomyLevel);

  if (!repoToken) {
    core.warning(
      'No repo_token provided — skipping PR creation. ' +
      'Add `repo_token: ${{ secrets.GITHUB_TOKEN }}` to create a PR automatically.'
    );
    return;
  }

  const octokit = github.getOctokit(repoToken);
  const { owner, repo } = github.context.repo;

  // Check if branch already exists
  const branch = 'agentic/onboarding';
  let branchExists = false;
  try {
    await octokit.rest.repos.getBranch({ owner, repo, branch });
    branchExists = true;
  } catch {
    branchExists = false;
  }

  if (branchExists) {
    core.info(`Branch ${branch} already exists — skipping PR creation. Push to that branch to update the existing PR.`);
    return;
  }

  // Get the default branch SHA
  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;
  const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
  const baseSha = ref.object.sha;

  // Read generated files
  const agenticDir = path.join(workspace, '.agentic');
  const profileContent = fs.readFileSync(path.join(agenticDir, 'profile.json'), 'utf-8');
  const policyContent = fs.readFileSync(path.join(agenticDir, 'policy.json'), 'utf-8');

  // Create branch
  await octokit.rest.git.createRef({
    owner, repo,
    ref: `refs/heads/${branch}`,
    sha: baseSha
  });

  // Upsert .agentic/profile.json
  await upsertFile(octokit, owner, repo, branch, '.agentic/profile.json', profileContent);
  // Upsert .agentic/policy.json
  await upsertFile(octokit, owner, repo, branch, '.agentic/policy.json', policyContent);

  // Create PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner, repo,
    title: 'chore: onboard to Agentic SDLC framework',
    head: branch,
    base: defaultBranch,
    body: [
      '## Agentic SDLC Onboarding',
      '',
      'This PR adds `.agentic/` configuration generated by the Agentic SDLC action.',
      '',
      '**Review checklist:**',
      '- [ ] Confirm `profile.json` has the correct `test`/`lint`/`build` commands',
      '- [ ] Set `repository.owner` to your GitHub org if it shows a placeholder',
      '- [ ] Adjust `policy.json` autonomy level for your team',
      '- [ ] Add any `protected_paths` the auto-detection missed',
      '',
      '> Re-run the `profile-generate` command any time your repo structure changes.'
    ].join('\n')
  });

  core.info(`✓ Opened PR #${pr.number}: ${pr.html_url}`);
  core.setOutput('pr_url', pr.html_url);
  core.setOutput('pr_number', String(pr.number));
}

async function upsertFile(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string, repo: string, branch: string,
  filePath: string, content: string
): Promise<void> {
  const encoded = Buffer.from(content).toString('base64');
  let sha: string | undefined;

  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: filePath, ref: branch });
    if (!Array.isArray(data) && data.type === 'file') sha = data.sha;
  } catch {
    sha = undefined;
  }

  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo,
    path: filePath,
    message: `chore: add ${filePath} for Agentic SDLC onboarding`,
    content: encoded,
    branch,
    ...(sha ? { sha } : {})
  });
}

run();
