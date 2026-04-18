import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ strict: false });
addFormats(ajv);

const SCHEMA_DIR = path.join(__dirname, '../../../contracts/v1');

async function loadSchema(name: string) {
  const schemaPath = path.join(SCHEMA_DIR, `${name}.schema.json`);
  if (!await fs.pathExists(schemaPath)) return null;
  return fs.readJson(schemaPath);
}

async function validateFile(filePath: string, schemaName: string): Promise<{ valid: boolean; errors: string[] }> {
  const schema = await loadSchema(schemaName);
  if (!schema) {
    return { valid: false, errors: [`Schema not found: ${schemaName}.schema.json`] };
  }

  const data = await fs.readJson(filePath).catch(() => null);
  if (data === null) {
    return { valid: false, errors: [`Could not parse JSON: ${filePath}`] };
  }

  const validate = ajv.compile(schema);
  const valid = validate(data) as boolean;
  const errors = validate.errors?.map(e => `  ${e.instancePath || '(root)'} ${e.message}`) ?? [];
  return { valid, errors };
}

export const validateCommand = new Command('validate')
  .description('Validate .agentic/ files against the Agentic SDLC contracts')
  .option('--dir <path>', 'Repository root to validate (default: current directory)', '.')
  .action(async (options) => {
    const repoRoot = path.resolve(options.dir);
    const agenticDir = path.join(repoRoot, '.agentic');

    if (!await fs.pathExists(agenticDir)) {
      console.error(chalk.red('No .agentic/ directory found. Run `agentic init` to get started.'));
      process.exit(1);
    }

    const checks: Array<{ file: string; schema: string }> = [
      { file: path.join(agenticDir, 'profile.json'), schema: 'profile' },
      { file: path.join(agenticDir, 'policy.json'), schema: 'policy' }
    ];

    let allValid = true;
    for (const { file, schema } of checks) {
      const label = path.relative(repoRoot, file);
      if (!await fs.pathExists(file)) {
        console.log(chalk.yellow(`⚠  ${label} — not found (optional)`));
        continue;
      }

      const { valid, errors } = await validateFile(file, schema);
      if (valid) {
        console.log(chalk.green(`✓  ${label}`));
      } else {
        allValid = false;
        console.log(chalk.red(`✗  ${label}`));
        for (const err of errors) {
          console.log(chalk.red(err));
        }
      }
    }

    if (!allValid) {
      console.log('');
      console.log(chalk.red('Validation failed. Fix the errors above and re-run.'));
      process.exit(1);
    } else {
      console.log('');
      console.log(chalk.green('All checks passed.'));
    }
  });
