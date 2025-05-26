type Level = 'debug' | 'info';

const noop = () => {};

export const createLogger = (level: Level = 'debug') => {
    return {
        /* eslint-disable no-console */
        debug: level === 'debug' ? console.log : noop,
        info: console.info,
        error: console.error,
        /* eslint-enable no-console */
    };
};

export type Logger = ReturnType<typeof createLogger>;
