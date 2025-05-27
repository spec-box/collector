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
        const logger = createLogger(cliOptions.verbose ? 'debug' : 'info');
        const explorer = cosmiconfig('spec-collector');
        const searchConfigResult = await explorer.search();

        if (!searchConfigResult) {
            logger.error(
                'Config file not found. Create config file https://github.com/spec-box/collector?tab=readme-ov-file#конфигурация',
            );
            process.exit(1);
        }

        const config = (searchConfigResult?.config ?? {}) as Settings;

        await collectSuite(config, cliOptions, logger);
    });

program.parse();
