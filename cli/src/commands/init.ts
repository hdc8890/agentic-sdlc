import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export const initCommand = new Command('init')
  .description('Scaffold .agentic/ in the current repository with a starter profile and policy')
  .option('--autonomy <level>', 'Initial autonomy level: assistive | semi_autonomous | bounded_autonomous | fully_autonomous', 'semi_autonomous')
  .option('--dry-run', 'Print what would be created without writing files')
  .action(async (options) => {
    const repoRoot = process.cwd();
    const agenticDir = path.join(repoRoot, '.agentic');
    const profilePath = path.join(agenticDir, 'profile.json');
    const policyPath = path.join(agenticDir, 'policy.json');

    if (options.dryRun) {
      console.log(chalk.yellow('[dry-run] Would create:'));
      console.log(`  ${profilePath}`);
      console.log(`  ${policyPath}`);
      return;
    }

    if (await fs.pathExists(agenticDir)) {
      console.error(chalk.red('Error: .agentic/ already exists. Run `agentic profile` to regenerate the profile.'));
      process.exit(1);
    }

    await fs.ensureDir(agenticDir);

    // Starter profile — populated with defaults; teams run `agentic profile` to auto-discover
    const starterProfile = {
      schema_version: 'v1',
      id: path.basename(repoRoot),
      repository: {
        owner: '<github-org>',
        name: path.basename(repoRoot),
        default_branch: 'main'
      },
      ecosystems: [],
      working_roots: ['.'],
      protected_paths: [],
      commands: {},
      _instructions: 'Run `agentic profile --generate` to auto-discover ecosystems and commands from this repo.'
    };

    // Starter policy
    const starterPolicy = {
      schema_version: 'v1',
      autonomy_level: options.autonomy,
      require_human_review_on: ['protected_path_changes', 'security_related', 'dependency_changes'],
      auto_merge: false,
      max_execution_steps: 10
    };

    await fs.writeJson(profilePath, starterProfile, { spaces: 2 });
    await fs.writeJson(policyPath, starterPolicy, { spaces: 2 });

    console.log(chalk.green('✓ Created .agentic/profile.json'));
    console.log(chalk.green('✓ Created .agentic/policy.json'));
    console.log('');
    console.log(chalk.bold('Next steps:'));
    console.log('  1. Run `agentic profile --generate` to auto-discover your repo context');
    console.log('  2. Review and customize .agentic/profile.json');
    console.log('  3. Adjust .agentic/policy.json to match your team\'s autonomy preferences');
    console.log('  4. Commit .agentic/ and add the GitHub Action (see action/README.md)');
  });
