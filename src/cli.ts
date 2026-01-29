#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../package.json';
import {collectSuite} from './index';
import {CliOptions, Settings} from './typings';
import {cosmiconfig} from 'cosmiconfig';
import {createLogger} from './logger';
import {InitOptions, initCommand} from './initCommand';

const program = new Command();

program
    .name('spec-collector')
    .description('Collect spec-box suite from code of your test files')
    .version(version);

program
    .command('init')
    .description('Create a spec-collector configuration file')
    .option('-f, --force', 'Overwrite existing config file')
    .action(async (options: InitOptions) => {
        const logger = createLogger('info');
        await initCommand(options, logger);
    });

program
    .option('-u, --upload', 'Upload files to spec-box server')
    .option('--verbose', 'Enable verbose logging')
    .option('-c, --config <path>', 'Path to config file')
    .action(async (cliOptions: Partial<CliOptions>) => {
        const logger = createLogger(cliOptions.verbose ? 'debug' : 'info');
        const explorer = cosmiconfig('spec-collector');

        let searchConfigResult;

        if (cliOptions.config) {
            // If config path is specified, load only from that path
            searchConfigResult = await explorer.load(cliOptions.config);

            if (!searchConfigResult) {
                logger.error(`Config file not found at specified path: ${cliOptions.config}`);
                process.exit(1);
            }
        } else {
            // Otherwise, search for config file automatically
            searchConfigResult = await explorer.search();

            if (!searchConfigResult) {
                logger.error(
                    'Config file not found. Create config file https://github.com/spec-box/collector?tab=readme-ov-file#конфигурация',
                );
                logger.info('You can create a default config file by running: spec-collector init');
                process.exit(1);
            }
        }

        const config = (searchConfigResult?.config ?? {}) as Settings;

        await collectSuite(config, cliOptions, logger);
    });

program.parse();
