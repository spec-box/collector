#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../package.json';
import {collectSuite} from './index';
import {CliOptions, Settings} from './typings';

const program = new Command();

program
    .name('spec-collector')
    .description('Collect spec-box suite from code of your test files')
    .version(version);

program
    .option('-r, --report <path>', 'Path to Playwright JSON report file ')
    // .option('--verbose', 'Print debug info')
    .option('-c, --config <path>', 'Path to Playwright config file ')
    .option('-f, --filter <pattern>', 'Filter test files by pattern (e.g., exclude setup files)')
    .option('-l, --levels <number>', 'Number of nested levels of spec tree')
    .option('-u, --upload', 'Upload files to spec-box server')
    .action(async (cliOptions: Partial<CliOptions>) => {
        const {report, filter, levels, config, upload} = cliOptions;

        const options = {
            jsonReportPath: report,
            ignoreFiles: filter ? (filter ?? '').split(' ') : undefined,
            levels: levels,
            configPath: config,
            shouldUpload: upload ?? false,
        } as Settings;

        for (const [key, value] of Object.entries(options)) {
            if (value === undefined) {
                delete options[key as keyof Settings];
            }
        }

        await collectSuite(options);
    });

program.parse();
