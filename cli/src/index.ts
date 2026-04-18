#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { profileCommand } from './commands/profile-generate';
import { validateCommand } from './commands/validate';
import { statusCommand } from './commands/status';

const program = new Command();

program
  .name('agentic')
  .description('Agentic SDLC — onboard your repo and integrate with AI-driven workflows')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(profileCommand);
program.addCommand(validateCommand);
program.addCommand(statusCommand);

program.parse(process.argv);
