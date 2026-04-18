import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

export interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  skipped: boolean;
}

export async function validateAgenticDir(
  workspace: string,
  contractsDir: string
): Promise<ValidationResult[]> {
  const checks: Array<{ file: string; schema: string; required: boolean }> = [
    { file: '.agentic/profile.json', schema: 'profile', required: true },
    { file: '.agentic/policy.json', schema: 'policy', required: false }
  ];

  const results: ValidationResult[] = [];

  for (const check of checks) {
    const filePath = path.join(workspace, check.file);
    const schemaPath = path.join(contractsDir, `${check.schema}.schema.json`);

    if (!fs.existsSync(filePath)) {
      if (check.required) {
        results.push({
          file: check.file,
          valid: false,
          errors: [`Required file not found. This repo may not have been onboarded yet.`],
          skipped: false
        });
      } else {
        results.push({ file: check.file, valid: true, errors: [], skipped: true });
      }
      continue;
    }

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      results.push({
        file: check.file,
        valid: false,
        errors: [`Invalid JSON: ${(e as Error).message}`],
        skipped: false
      });
      continue;
    }

    // Load schema
    if (!fs.existsSync(schemaPath)) {
      results.push({
        file: check.file,
        valid: false,
        errors: [`Schema not found at ${schemaPath}. This is a bug in the action.`],
        skipped: false
      });
      continue;
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const validate = ajv.compile(schema);
    const valid = validate(data) as boolean;

    results.push({
      file: check.file,
      valid,
      errors: validate.errors?.map(e => `${e.instancePath || '(root)'} ${e.message}`) ?? [],
      skipped: false
    });
  }

  return results;
}
