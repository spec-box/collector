import {writeFileSync} from 'node:fs';
import {uploadEntities} from '@spec-box/sync/dist/lib/upload/upload-entities';

import {CliOptions, Settings} from './typings';
import {SpecCollector} from './SpecCollector';
import {generateReport} from './generateReport';
import {Logger} from './logger';

const defaultSettings = {
    ignoreFiles: [] as string[],
    emptyTestsYamlPath: './specBoxTests.yml',
    levels: 3,
    outputFile: './spec-collector-result.json',
};

export async function collectSuite(
    settings: Settings,
    options: Partial<CliOptions>,
    logger: Logger,
): Promise<void> {
    logger.info('Starting with settings', settings);

    const {projects, ignoreFiles, levels, outputFile, host, specBoxProject, formatTitle} = {
        ...defaultSettings,
        ...settings,
    };

    logger.info('Building spec-box suite');
    const collector = new SpecCollector({
        levels: levels,
        pathFilter: (path) =>
            ignoreFiles.every((ignoredPath: string) => !path.includes(ignoredPath)),
        formatTitleParams: formatTitle,
    });

    for (const project of projects) {
        const {configPath} = project;
        logger.info('Generate report for', configPath);
        const report = generateReport(configPath);

        collector.loadData(report, project);
    }

    logger.info('Building spec from reports');
    const specs = await collector.buildSpec();

    if (!options.upload) {
        logger.info('Spec generated. Saving to', outputFile);
        writeFileSync(outputFile, JSON.stringify(specs, null, 4));
        return;
    }

    if (!host || !specBoxProject) {
        logger.error('Specify host and specBoxProject in config for upload specs');
        return;
    }

    logger.info('Uploading suite to host', host);
    await uploadEntities(specs, {
        host,
        project: specBoxProject,
    });
    logger.info('Success!');
}
