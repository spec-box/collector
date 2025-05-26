import {appendFileSync, existsSync, unlinkSync, writeFileSync} from 'node:fs';
import {relative, resolve} from 'node:path';

import type {TestDetails} from '@playwright/test';
import {parse} from 'stacktrace-parser';
import {stringify} from 'yaml';

type EmptyTest = (name: string, details?: TestDetails) => void;

export type TestSpecOptions = {
    empty: EmptyTest;
};

type Options = {
    clearAtStart: boolean;
    file: string;
    callLevel: number;
};

const defaultOptions: Options = {
    file: 'specBoxTests.yml',
    callLevel: 2,
    clearAtStart: true,
};

class EmptyTestCollector {
    options: Options;

    constructor(options: Partial<Options> = {}) {
        this.options = {
            ...defaultOptions,
            ...options,
        };

        /* eslint-disable-next-line no-console */
        console.info('EmptyTestCollector will collect empty tests to', resolve(this.options.file));

        if (this.options.clearAtStart && existsSync(this.options.file)) {
            unlinkSync(this.options.file);
        }
    }

    emptyTest: EmptyTest = (testName, details) => {
        const fileName = this.getTestFilename();
        const relativeFilename = fileName ? relative(process.cwd(), fileName) : undefined;
        const item = this.stringifyTest(testName, relativeFilename, details);

        /* eslint-disable-next-line no-console */
        console.info(item);
        this.saveTest(item);
    };

    getTestFilename = () => {
        const error = new Error('e');

        if (!error.stack) {
            return undefined;
        }

        const errorStack = parse(error.stack);

        return errorStack[this.options.callLevel]?.file ?? undefined;
    };

    stringifyTest = (testName: string, fileName?: string, details?: TestDetails) => {
        return stringify([{testName, fileName, details}]);
    };

    saveTest = (item: string) => {
        const {file} = this.options;

        if (!existsSync(file)) {
            writeFileSync(file, '', 'utf8');
        }

        appendFileSync(file, item, 'utf8');
    };
}

const collector = new EmptyTestCollector();

export const extendTest = <T>(test: T) => {
    (test as T & TestSpecOptions).empty = collector.emptyTest;

    return test as T & TestSpecOptions;
};
