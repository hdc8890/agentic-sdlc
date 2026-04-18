import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { validateAgenticDir } from './validate';

async function run(): Promise<void> {
  try {
    const configDir = core.getInput('config_dir', { required: false }) || '.agentic';
    const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
    const actionPath = process.env.GITHUB_ACTION_PATH ?? path.join(__dirname, '..', '..');
    const contractsDir = path.join(actionPath, 'contracts', 'v1');

    const agenticDir = path.join(workspace, configDir);

    core.info(`Validating ${configDir}/ against contracts`);
    core.info(`Workspace: ${workspace}`);

    if (!fs.existsSync(agenticDir)) {
      core.setFailed(
        `No ${configDir}/ directory found. This repo has not been onboarded yet.\n` +
        'See docs/architecture/end-to-end-flow.md for the onboarding process.'
      );
      return;
    }

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
        'Validation failed. Fix the errors above and push again.'
      );
    } else {
      core.info('All .agentic/ files are valid.');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(`Action failed: ${message}`);
  }
}

run();
