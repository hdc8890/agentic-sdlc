import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export const statusCommand = new Command('status')
  .description('Show the current Agentic SDLC status for this repository')
  .option('--dir <path>', 'Repository root (default: current directory)', '.')
  .action(async (options) => {
    const repoRoot = path.resolve(options.dir);
    const agenticDir = path.join(repoRoot, '.agentic');
    const profilePath = path.join(agenticDir, 'profile.json');
    const policyPath = path.join(agenticDir, 'policy.json');

    console.log(chalk.bold('Agentic SDLC Status'));
    console.log(chalk.gray(`Repository: ${repoRoot}`));
    console.log('');

    // Config section
    console.log(chalk.bold('Configuration'));
    const profileExists = await fs.pathExists(profilePath);
    const policyExists = await fs.pathExists(policyPath);

    console.log(`  profile.json  ${profileExists ? chalk.green('✓ present') : chalk.red('✗ missing — run `agentic init`')}`);
    console.log(`  policy.json   ${policyExists ? chalk.green('✓ present') : chalk.yellow('⚠  missing — using org defaults')}`);

    if (profileExists) {
      const profile = await fs.readJson(profilePath);
      console.log('');
      console.log(chalk.bold('Profile'));
      console.log(`  repo:        ${profile.repository?.owner}/${profile.repository?.name}`);
      console.log(`  ecosystems:  ${profile.ecosystems?.join(', ') || '(none detected)'}`);
      console.log(`  test:        ${profile.commands?.test || '(not set)'}`);
      console.log(`  lint:        ${profile.commands?.lint || '(not set)'}`);
      console.log(`  build:       ${profile.commands?.build || '(not set)'}`);
    }

    if (policyExists) {
      const policy = await fs.readJson(policyPath);
      console.log('');
      console.log(chalk.bold('Policy'));
      console.log(`  autonomy:    ${policy.autonomy_level}`);
      console.log(`  auto-merge:  ${policy.auto_merge ? chalk.yellow('enabled') : 'disabled'}`);
      console.log(`  review on:   ${policy.require_human_review_on?.join(', ') || '(none)'}`);
    }

    // Note: active task/execution state will be fetched from the orchestration service
    // once the orchestration API endpoint is configured in .agentic/profile.json
    console.log('');
    console.log(chalk.gray('Active task status requires connection to the orchestration service.'));
    console.log(chalk.gray('Configure the orchestration endpoint in .agentic/profile.json to enable this.'));
  });
