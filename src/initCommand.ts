import {existsSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {Logger} from './logger';

export interface InitOptions {
    force?: boolean;
}

export async function initCommand(options: InitOptions, logger: Logger): Promise<void> {
    const configFileName = 'spec-collector.config.js';
    const configPath = join(process.cwd(), configFileName);

    if (existsSync(configPath) && !options.force) {
        logger.error(
            `Configuration file ${configFileName} already exists. Use --force to overwrite.`,
        );
        process.exit(1);
    }

    const defaultConfig = `module.exports = {
  projects: [
    {
      configPath: './playwright.config.ts',
      // emptyTestsYamlPath: './specBoxTests.yml', // необязательно
      // rootPath: './', // необязательно
    },
  ],
  // Настройки форматирования заголовков (необязательно)
  formatTitle: {
    remove: [],
    replace: [],
  },
  // Игнорируемые файлы (необязательно)
  ignoreFiles: ['setup'],
  // Количество уровней структуры (необязательно, по умолчанию 3)
  levels: 3,
  // Путь к выходному файлу (необязательно)
  outputFile: './spec-collector-result.json',
  // Настройки для загрузки в spec-box (необходимы только для опции --upload)
  // host: 'https://your-spec-box-server.com',
  // specBoxProject: 'your-project-name',
};
`;

    try {
        writeFileSync(configPath, defaultConfig, 'utf8');
        logger.info(`Configuration file created: ${configFileName}`);
        logger.info('Please edit the configuration file to match your project setup.');
        logger.info(
            'For more information, see: https://github.com/spec-box/collector#конфигурация',
        );
    } catch (error) {
        logger.error(`Failed to create configuration file: ${(error as Error).message}`);
        process.exit(1);
    }
}
