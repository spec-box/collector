import {Settings} from './typings';
import {SpecCollector} from './SpecCollector';
import {generateReport} from './generateReport';
import {uploadEntities} from '@spec-box/sync/dist/lib/upload/upload-entities';

const {cosmiconfig} = require('cosmiconfig');

const defaultSettings = {
    ignoreFiles: [] as string[],
    emptyTestsYamlPath: './specBoxTests.yml',
    levels: 3,
};

export async function collectSuite(settings: Settings) {
    const explorer = cosmiconfig('spec-collector');
    const {config: settingsFromConfig} = await explorer.search();

    const mergedSettings = {
        ...defaultSettings,
        ...settingsFromConfig,
        ...settings,
    };
    console.info('Starting with settings', mergedSettings);

    const {
        jsonReportPath,
        configPath,
        ignoreFiles,
        emptyTestsYamlPath,
        levels,
        shouldUpload,
        host,
        project,
    } = mergedSettings;

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

    if (!shouldUpload) {
        console.log('Spec generated');
        console.log(JSON.stringify(specs, null, 4));
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
