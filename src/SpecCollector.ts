import {existsSync, readFileSync} from 'node:fs';
import {parse as parsePath, relative} from 'node:path';

import {parse as parseYaml} from 'yaml';

import {
    EmptyTest,
    EmptyTestsYaml,
    FormatOptions,
    JSONReport,
    JSONReportSpec,
    JSONReportSuite,
    PathFilter,
    ProjectData,
} from './typings';

type Options = {
    pathFilter?: PathFilter;
    levels?: number;
    formatTitleParams?: FormatOptions;
};

type PlaywrightSpecData = JSONReportSpec & {
    suiteTitle: string;
};

export class SpecCollector {
    options: Options;

    pwTestMap: Record<string, PlaywrightSpecData[]>;
    emptyTestMap: Record<string, EmptyTest[]>;

    structureTags: Array<Set<string>> = [];

    constructor(options: Options) {
        this.options = options;

        this.pwTestMap = {};
        this.emptyTestMap = {};

        this.initTagMap();
    }

    loadData = (configProjectData: ProjectData) => {
        const defaultProjectData = {
            emptyTestsYamlPath: './specBoxTests.yml',
            rootPath: './',
        };

        const {jsonReportPath, emptyTestsYamlPath, rootPath} = {
            ...defaultProjectData,
            ...configProjectData,
        };

        const report = JSON.parse(readFileSync(jsonReportPath, 'utf8')) as JSONReport;
        this.loadPlaywrightTestMap(report, rootPath);

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

        const features = [];

        // FIXME добавить возможность загрузки скипнутых тестов
        const skipTitles = new Set<string>();

        for (const path of allPaths) {
            if (this.options.pathFilter && !this.options.pathFilter(path)) {
                continue;
            }

            const emptyTestsAssertion = this.loadEmptyTestAssertion(path);
            const pwTestsAssertion = this.loadPwTestFromAssertion(path, skipTitles);

            const noAssertion = emptyTestsAssertion.length === 0 && pwTestsAssertion.length === 0;
            if (noAssertion) {
                continue;
            }

            this.loadAttributesForPath(path);

            const feature = {
                code: this.getFeatureCode(path),
                title: this.getFeatureTitle(path),

                groups: [
                    {
                        title: this.getFeatureTitle(path),
                        assertions: [...pwTestsAssertion, ...emptyTestsAssertion],
                    },
                ],
                attributes: this.getFeatureAttributes(path),
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

    // build methods
    getFeatureCode = (path: string) => {
        return path.replaceAll('/', '_');
    };

    getFeatureTitle = (path: string) => {
        const {name} = parsePath(path);

        return this.formatFilename(name);
    };

    getFeatureFilename = (path: string) => {
        const {name} = parsePath(path);

        return name;
    };

    formatPathElement = (attribute: string) => {
        const attributeWithoutDash = attribute.replaceAll('-', ' ');

        return attributeWithoutDash[0]?.toUpperCase() + attributeWithoutDash.slice(1);
    };

    getAttributesFromPath = (path: string) => {
        const {dir, name} = parsePath(path);
        const pathArray = dir.split('/');

        const editedFileName = this.formatFilename(name);
        const attributes = [...pathArray, editedFileName].filter(Boolean) as string[];

        return attributes.slice(0, this.options.levels || 3).map(this.formatPathElement);
    };

    formatFilename = (fileName: string) => {
        const elementsToRemove = [
            '.e2e',
            '.integration',
            '.test',
            '.ts$',
            '.tsx$',
            ...(this.options.formatTitleParams?.remove ?? []),
        ];

        const removeRegExp = new RegExp(elementsToRemove.join('|'), 'g');

        let nameWithRemovedParts = fileName.replaceAll(removeRegExp, '');

        if (this.options.formatTitleParams?.replace) {
            for (const [find, replace] of this.options.formatTitleParams.replace) {
                const replaceRegExp = new RegExp(find, 'g');
                nameWithRemovedParts = nameWithRemovedParts.replaceAll(replaceRegExp, replace);
            }
        }

        return this.formatPathElement(nameWithRemovedParts);
    };

    getFeatureAttributes = (path: string) => {
        const attributes = this.getAttributesFromPath(path);

        const result: Record<string, string[]> = {};

        for (const [index, attributeValue] of attributes.entries()) {
            result[`lvl${index}`] = [attributeValue];
        }

        return result;
    };

    loadAttributesForPath = (path: string) => {
        const attributes = this.getAttributesFromPath(path);

        for (const [index, value] of attributes.entries()) {
            this.structureTags[index]?.add(value);
        }
    };

    loadPwTestFromAssertion = (path: string, skips: Set<string>) => {
        const pwTestsForPath = this.pwTestMap[path];

        if (!pwTestsForPath) {
            return [];
        }

        return pwTestsForPath.map((spec) => {
            const expectedStatus = spec.tests[0]?.expectedStatus ?? 'passed';
            const isEnabledInCode = expectedStatus === 'passed';
            const isEnabledInTestcop = !skips.has(spec.suiteTitle);

            const isTestEnabled = isEnabledInCode && isEnabledInTestcop;

            return {
                title: spec.suiteTitle,
                automationState: isTestEnabled ? ('Automated' as const) : ('Unknown' as const),
            };
        });
    };

    loadEmptyTestAssertion = (path: string) => {
        const emptyTestsForPath = this.emptyTestMap[path];

        if (!emptyTestsForPath) {
            return [];
        }

        return emptyTestsForPath.map((test) => ({
            title: test.testName,
            automationState: 'Unknown' as const,
        }));
    };

    initTagMap = () => {
        this.structureTags = Array.from({length: this.options.levels ?? 3}).map(() => new Set());
    };

    getProjectAttributes = () => {
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

    getProjectTrees = () => {
        return [
            {
                title: 'Some tree',
                code: 'someTree2',
                attributes: this.structureTags.map((_value, index) => `lvl${index}`),
            },
        ];
    };

    loadEmptyTestMap = (tests: EmptyTestsYaml) => {
        for (const test of tests) {
            const fileName = test.fileName ?? '';

            if (!this.emptyTestMap[fileName]) {
                this.emptyTestMap[fileName] = [];
            }

            this.emptyTestMap[fileName]?.push(test);
        }
    };

    loadPlaywrightTestMap(report: JSONReport, rootPath: string) {
        const DELIMITER = ' \u203A ';

        const suitesStack = [report.suites];

        while (suitesStack.length !== 0) {
            const suites = suitesStack.pop();

            if (!suites) {
                continue;
            }

            for (const suite of suites) {
                const suiteName = this.getSuiteName(suite);

                for (const spec of suite.specs) {
                    const filePath = relative(rootPath, spec.file);

                    const targetSpec = this.pwTestMap[filePath];

                    const suiteNameWithDelimiter = suiteName ? `${suiteName}${DELIMITER}` : '';
                    const currentSpecData = {
                        ...spec,
                        suiteTitle: `${suiteNameWithDelimiter}${spec.title}`,
                    };

                    if (targetSpec) {
                        targetSpec.push(currentSpecData);
                    } else {
                        this.pwTestMap[filePath] = [currentSpecData];
                    }
                }

                if (suite.suites) {
                    suitesStack.push(suite.suites);
                }
            }
        }
    }

    getSuiteName = (suite: JSONReportSuite) => {
        const suiteHasNoTitle = !suite.title || suite.title === suite.file;

        return suiteHasNoTitle ? '' : suite.title;
    };
}
