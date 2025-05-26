#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../package.json';
import {collectSuite} from './index';
import {CliOptions, Settings} from './typings';
import {cosmiconfig} from 'cosmiconfig';
import {createLogger} from './logger';

const program = new Command();

program
    .name('spec-collector')
    .description('Collect spec-box suite from code of your test files')
    .version(version);

program
    .option('-u, --upload', 'Upload files to spec-box server')
    .option('--verbose', 'Enable verbose logging')
    .action(async (cliOptions: Partial<CliOptions>) => {
        const explorer = cosmiconfig('spec-collector');
        const config = ((await explorer.search())?.config ?? {}) as Settings;

        const logger = createLogger(cliOptions.verbose ? 'debug' : 'info');

        await collectSuite(config, cliOptions, logger);
    });

program.parse();
