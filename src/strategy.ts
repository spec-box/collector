import {CollectorOptions, EmptyTest, JSONReportSpec} from './typings';
import {parse as parsePath} from 'path';

export type StrategyOptions = {
    emptyTests: EmptyTest[];
    tests: JSONReportSpec[];
    path: string;
};

export class DefaultStrategy {
    collectorOptions: CollectorOptions;

    constructor(collectorOptions: CollectorOptions) {
        this.collectorOptions = collectorOptions;
    }

    getFeatureTitle = ({path}: StrategyOptions) => {
        const attributes = this.parsePathToAttributes(path);
        const levels = this.collectorOptions.levels || 3;

        if (attributes.length > levels) {
            const excludedElements = attributes.slice(levels, -1);
            const fileName = attributes[attributes.length - 1];
            const titleElements = [...excludedElements, fileName];
            return titleElements.map(this.formatPathElement).join(' / ');
        }

        return this.getTitleFromPath(path);
    };

    getGroups = ({tests, emptyTests, path}: StrategyOptions) => {
        const emptyTestsAssertion = this.loadEmptyTestAssertion(emptyTests);
        const pwTestsAssertion = this.loadPwTestFromAssertion(tests);

        const groups = [];

        if (pwTestsAssertion.length > 0) {
            groups.push({
                title: this.getTitleFromPath(path),
                assertions: pwTestsAssertion,
            });
        }

        if (emptyTestsAssertion.length > 0) {
            groups.push({
                title: `${this.getTitleFromPath(path)} - Empty Tests`,
                assertions: emptyTestsAssertion,
            });
        }

        return groups;
    };

    getAttributes = ({path}: StrategyOptions) => {
        const attributes = this.parsePathToAttributes(path);
        return attributes.slice(0, this.collectorOptions.levels || 3).map(this.formatPathElement);
    };

    getTitleFromPath = (path: string) => {
        const {name} = parsePath(path);

        return this.formatFilename(name);
    };

    loadEmptyTestAssertion = (emptyTests: EmptyTest[]) => {
        return emptyTests.map((test) => ({
            title: test.testName,
            automationState: 'Unknown' as const,
        }));
    };

    loadPwTestFromAssertion = (tests: JSONReportSpec[]) => {
        const DELIMITER = ' \u203A';

        return tests.map((spec) => {
            const expectedStatus = spec.tests[0]?.expectedStatus ?? 'passed';
            const isEnabledInCode = expectedStatus === 'passed';

            const suites =
                spec.parentSuites.length > 0
                    ? spec.parentSuites.reduce((result, title) => {
                          return `${result} ${DELIMITER} ${title}`;
                      })
                    : '';

            return {
                title: suites ? `${suites} ${DELIMITER} ${spec.title}` : spec.title,
                automationState: isEnabledInCode ? ('Automated' as const) : ('Unknown' as const),
            };
        });
    };

    formatFilename = (fileName: string) => {
        const elementsToRemove = [
            '.e2e',
            '.integration',
            '.test',
            '.ts$',
            '.tsx$',
            ...(this.collectorOptions.formatTitleParams?.remove ?? []),
        ];

        const removeRegExp = new RegExp(elementsToRemove.join('|'), 'g');

        let nameWithRemovedParts = fileName.replaceAll(removeRegExp, '');

        if (this.collectorOptions.formatTitleParams?.replace) {
            for (const [find, replace] of this.collectorOptions.formatTitleParams.replace) {
                const replaceRegExp = new RegExp(find, 'g');
                nameWithRemovedParts = nameWithRemovedParts.replaceAll(replaceRegExp, replace);
            }
        }

        return this.formatPathElement(nameWithRemovedParts);
    };

    formatPathElement = (attribute: string) => {
        const attributeWithoutDash = attribute.replaceAll('-', ' ');

        return attributeWithoutDash[0]?.toUpperCase() + attributeWithoutDash.slice(1);
    };

    private parsePathToAttributes = (path: string): string[] => {
        const {dir, name} = parsePath(path);
        const pathArray = dir.split('/');
        const editedFileName = this.formatFilename(name);
        return [...pathArray, editedFileName].filter(Boolean) as string[];
    };
}
