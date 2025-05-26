import {existsSync, readFileSync} from 'node:fs';
import {parse as parsePath, relative} from 'node:path';

import {parse as parseYaml} from 'yaml';

import {
    CollectorOptions,
    EmptyTest,
    EmptyTestsYaml,
    JSONReport,
    JSONReportSpec,
    JSONReportSuite,
    ProjectData,
} from './typings';
import {DefaultStrategy} from './strategy';

export class SpecCollector {
    options: CollectorOptions;

    pwTestMap: Record<string, JSONReportSpec[]>;
    emptyTestMap: Record<string, EmptyTest[]>;

    structureTags: Array<Set<string>> = [];

    constructor(options: CollectorOptions) {
        this.options = options;

        this.pwTestMap = {};
        this.emptyTestMap = {};

        this.initTagMap();
    }

    loadData = (playwrightReport: JSONReport, configProjectData: ProjectData) => {
        const defaultProjectData = {
            emptyTestsYamlPath: './specBoxTests.yml',
            rootPath: './',
        };

        const {emptyTestsYamlPath, rootPath} = {
            ...defaultProjectData,
            ...configProjectData,
        };

        this.loadPlaywrightTestMap(playwrightReport, rootPath);

        if (existsSync(emptyTestsYamlPath)) {
            const emptyTestsReport = parseYaml(
                readFileSync(emptyTestsYamlPath, 'utf8'),
            ) as EmptyTestsYaml;

            this.loadEmptyTestMap(emptyTestsReport);
        }
    };

    buildSpec = async () => {
        const allPaths = new Set<string>();

        for (const key of Object.keys(this.pwTestMap)) allPaths.add(key);
        for (const key of Object.keys(this.emptyTestMap)) allPaths.add(key);

        const collectStrategy = new DefaultStrategy(this.options);

        const features = [];

        for (const path of allPaths) {
            if (this.options.pathFilter && !this.options.pathFilter(path)) {
                continue;
            }

            const emptyTests = this.emptyTestMap[path] ?? [];
            const tests = this.pwTestMap[path] ?? [];

            const strategyOptions = {path, emptyTests, tests};

            const groups = collectStrategy.getGroups(strategyOptions);
            const title = collectStrategy.getFeatureTitle(strategyOptions);
            const structureAttributes = collectStrategy.getAttributes(strategyOptions);

            const hasAssertions =
                groups.length > 0 && groups.some((group) => group.assertions.length > 0);

            if (!hasAssertions) {
                continue;
            }

            this.loadAttributes(structureAttributes);

            this.loadAttributes(structureAttributes);

            const feature = {
                title,
                groups,

                code: this.getFeatureCode(path),
                attributes: this.wrapFeatureAttributes(structureAttributes),
                dependencies: [],
                fileName: this.getFeatureFilename(path),
                filePath: path + '.yml',
            };

            features.push(feature);
        }

        return {
            features: features,
            attributes: this.getProjectAttributes(),
            trees: this.getProjectTrees(),
            metaFilePath: '',
        };
    };

    private getFeatureCode = (path: string) => {
        return path.replaceAll('/', '_');
    };

    private getFeatureFilename = (path: string) => {
        const {name} = parsePath(path);

        return name;
    };

    private wrapFeatureAttributes = (attributes: string[]) => {
        const result: Record<string, string[]> = {};

        for (const [index, attributeValue] of attributes.entries()) {
            result[`lvl${index}`] = [attributeValue];
        }

        return result;
    };

    private loadAttributes = (attributes: string[]) => {
        for (const [index, value] of attributes.entries()) {
            this.structureTags[index]?.add(value);
        }
    };

    private initTagMap = () => {
        this.structureTags = Array.from({length: this.options.levels ?? 3}).map(() => new Set());
    };

    private getProjectAttributes = () => {
        return this.structureTags.map((tags, index) => {
            return {
                title: `lvl${index}`,
                code: `lvl${index}`,
                values: [...tags]
                    .filter(Boolean)
                    .map((value) => ({code: `lvl${index}_${value}`, title: value})),
            };
        });
    };

    private getProjectTrees = () => {
        return [
            {
                title: 'Some tree',
                code: 'someTree2',
                attributes: this.structureTags.map((_value, index) => `lvl${index}`),
            },
        ];
    };

    private loadEmptyTestMap = (tests: EmptyTestsYaml) => {
        for (const test of tests) {
            const fileName = test.fileName ?? '';

            if (!this.emptyTestMap[fileName]) {
                this.emptyTestMap[fileName] = [];
            }

            this.emptyTestMap[fileName]?.push(test);
        }
    };

    private loadPlaywrightTestMap(report: JSONReport, rootPath: string) {
        const suitesStack = [report.suites];

        while (suitesStack.length !== 0) {
            const suites: JSONReportSuite[] | undefined = suitesStack.pop();

            if (!suites) {
                continue;
            }

            for (const suite of suites) {
                const suiteName = this.getSuiteName(suite);
                const shouldAddSuiteName = suiteName && suites.length > 1;

                for (const spec of suite.specs) {
                    const filePath = relative(rootPath, spec.file);

                    const targetSpec = this.pwTestMap[filePath];

                    const parentSuites = suite.parentSuites ?? [];

                    const currentSpecData: JSONReportSpec = {
                        ...spec,
                        parentSuites: shouldAddSuiteName
                            ? [...parentSuites, suiteName]
                            : parentSuites,
                    };

                    if (targetSpec) {
                        targetSpec.push(currentSpecData);
                    } else {
                        this.pwTestMap[filePath] = [currentSpecData];
                    }
                }

                if (suite.suites) {
                    const parentSuites = suite.parentSuites ?? [];

                    suitesStack.push(
                        suite.suites.map((currentSuite) => {
                            return {
                                ...currentSuite,
                                parentSuites: shouldAddSuiteName
                                    ? [...parentSuites, suiteName]
                                    : parentSuites,
                            };
                        }),
                    );
                }
            }
        }
    }

    private getSuiteName = (suite: JSONReportSuite) => {
        const suiteHasNoTitle = !suite.title || suite.title === suite.file;

        return suiteHasNoTitle ? '' : suite.title;
    };
}
