#!/usr/bin/env node

import {Command} from 'commander';
import {version} from '../package.json';
import {collectSuite} from './index';
import {CliOptions, Settings} from './typings';
import {cosmiconfig} from 'cosmiconfig';

const program = new Command();

program
    .name('spec-collector')
    .description('Collect spec-box suite from code of your test files')
    .version(version);

program
    .option('-u, --upload', 'Upload files to spec-box server')
    .action(async (cliOptions: Partial<CliOptions>) => {
        const explorer = cosmiconfig('spec-collector');
        const config = ((await explorer.search())?.config ?? {}) as Settings;

        await collectSuite(config, cliOptions);
    });

program.parse();
