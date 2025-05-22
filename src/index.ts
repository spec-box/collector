import {CliOptions, Settings} from './typings';
import {SpecCollector} from './SpecCollector';
import {generateReport} from './generateReport';
import {uploadEntities} from '@spec-box/sync/dist/lib/upload/upload-entities';
import {writeFileSync} from 'node:fs';

const defaultSettings = {
    ignoreFiles: [] as string[],
    emptyTestsYamlPath: './specBoxTests.yml',
    levels: 3,
    configPath: './playwright.config.ts',
    outputFile: './spec-collector-result.json',
};

export async function collectSuite(
    settings: Settings,
    options: Partial<CliOptions>,
): Promise<void> {
    console.info('Starting with settings', settings);

    const {
        jsonReportPath,
        configPath,
        ignoreFiles,
        emptyTestsYamlPath,
        levels,
        outputFile,
        host,
        project,
    } = {
        ...defaultSettings,
        ...settings,
    };

    console.info('Generating playwright report');
    generateReport(configPath);

    console.info('Building spec-box suite');
    const collector = new SpecCollector({
        reportPath: jsonReportPath,
        emptyTestsYamlPath,
        levels: levels,
        pathFilter: (path) =>
            ignoreFiles.every((ignoredPath: string) => !path.includes(ignoredPath)),
    });

    const specs = await collector.buildSpec();

    if (!options.upload) {
        console.info('Spec generated. Saving to', outputFile);
        writeFileSync(outputFile, JSON.stringify(specs, null, 4));
        return;
    }

    if (!host || !project) {
        console.error('Specify host and project for upload specs');
        return;
    }

    console.info('Uploading suite to host', host);
    await uploadEntities(specs, {
        host,
        project,
    });
}

export * from './EmptyTestCollector';
