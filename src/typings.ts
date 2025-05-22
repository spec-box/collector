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

export type CliOptions = {
    upload: string;
};

export type ProjectData = {
    configPath: string;
    emptyTestsYamlPath?: string;
    rootPath?: string;
};

export type FormatOptions = {
    remove: string[];
    replace: [string, string][];
};

export type Settings = {
    projects: Array<ProjectData>;
    ignoreFiles?: string[];
    levels?: number;
    formatTitle: FormatOptions;
    specBoxProject?: string;
    host?: string;
    outputFile?: string;
};
