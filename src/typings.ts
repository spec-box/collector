import type {TestDetails} from '@playwright/test';

export type PathFilter = (path: string) => boolean;

export type JSONReport = {
    config: never;
    suites: JSONReportSuite[];
    errors: TestError[];
};
export type JSONReportSuite = {
    title: string;
    file: string;
    column: number;
    line: number;
    specs: JSONReportSpec[];
    suites?: JSONReportSuite[];
};

export type JSONReportSpec = {
    tags: string[];
    title: string;
    ok: boolean;
    tests: JSONReportTest[];
    id: string;
    file: string;
    line: number;
    column: number;
};

export type JSONReportTest = {
    timeout: number;
    annotations: {type: string; description?: string}[];
    expectedStatus: string;
    projectName: string;
    projectId: string;
    results: never;
    status: 'skipped' | 'expected' | 'unexpected' | 'flaky';
};

export type EmptyTest = {testName: string; fileName?: string; details?: TestDetails};
export type EmptyTestsYaml = Array<EmptyTest>;

export type EmptyTestsMap = Record<string, EmptyTest[]>;

export type CliOptions = {
    report: string;
    config: string;
    filter: string;
    levels: string;
    upload: string;
    host: string;
    project: string;
};

export type Settings = {
    ignoreFiles?: string[];
    jsonReportPath?: string;
    configPath?: string;
    emptyTestsYamlPath?: string;
    levels?: number;
    project?: string;
    host?: string;
    shouldUpload?: boolean;
};
