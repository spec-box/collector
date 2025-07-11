# @spec-box/collector

## Описание

`@spec-box/collector` — это инструмент для сбора spec-box спецификаций тестов из файлов тестов Playwright.

## Установка

```bash
npm install @spec-box/collector --save-dev
```

или

```bash
yarn add @spec-box/collector --dev
```

## Конфигурация

Создайте файл конфигурации `spec-collector.config.js`, `.spec-collectorrc`, `.spec-collectorrc.json`, `.spec-collectorrc.yaml`, `.spec-collectorrc.yml`, `.spec-collectorrc.js`, в корне вашего проекта.

Минимальная конфигурация

```javascript
module.exports = {
  projects: [
    {
      configPath: './tests/integration-tests/playwright.config.ts',
    },
  ],
  // host и specBoxProject нужны только для выгрузки
  host: 'https://your-spec-box-server.com',
  specBoxProject: 'your-project-name',
};
```

Пример полной конфигурации

```javascript
module.exports = {
  projects: [
    {
      jsonReportPath: './integrations/test-results/report.json',
      configPath: './integrations/playwright.config.ts',
      emptyTestsYamlPath: './integrations/specBoxTests.yml',
      rootPath: './',
    },
    {
      jsonReportPath: './e2e/test-results/report.json',
      configPath: './e2e/playwright.config.ts',
      emptyTestsYamlPath: './e2e/specBoxTests.yml',
      rootPath: './my-test-dir',
    },
  ],
  formatTitle: {
    remove: ['.common'],
    replace: [
      ['.int', ' [unternal]'],
      ['.external', ' [b2b]'],
    ],
  },
  ignoreFiles: ['setup'],
  levels: 3,
  outputFile: './spec-collector-result.json',
  host: 'https://your-spec-box-server.com',
  specBoxProject: 'your-project-name',
};
```

## Использование

### Быстрый старт

Создайте файл конфигурации с настройками по умолчанию:

```bash
npx spec-collector init
```

Затем отредактируйте созданный файл `spec-collector.config.js` в соответствии с вашим проектом.

### Запуск

Для корректной работе инструмента нужно чтобы запуск playwright тестов в list режиме отрабатывал без ошибок. Проверить можно выполнив

```bash
npx playwright test --list
```

Запускать через cli так

```bash
# сбор тест кейсов
npx spec-collector

# сбор тест кейсов с выгрузкой в spec-box
npx spec-collector -u
```

### Команды CLI

- `npx spec-collector init` — создать файл конфигурации с настройками по умолчанию
- `npx spec-collector init --force` — пересоздать файл конфигурации (перезаписать существующий)
- `npx spec-collector --help` — показать справку

### Работа со сценариями

Пакет дает возможность хранить в кодовой базе сценарии еще не написанных тестов. Playwright не будет видеть эти тесты и они не будут видны в отчетах. Сценарии могут использоваться для понимание реального тестового покрытия относительно целевого.

```typescript
import {test as baseTest} from '@playwright/test';
import {extendTest} from '@spec-box/collector';

// Расширяем базовый тест методом empty
const test = extendTest(baseTest);

// Определяем пустой тест
test.empty('Еще не реализованный тест');

// Обычный тест
test('Обычный тест', async ({page}) => {
  // ...
});
```

## Структура проекта

- `src/cli.ts` - CLI интерфейс
- `src/initCommand.ts` - Команда инициализации конфига
- `src/index.ts` - Основной модуль
- `src/SpecCollector.ts` - Класс для сбора спецификаций
- `src/EmptyTestCollector.ts` - Класс для работы со сценариями
- `src/generateReport.ts` - Функция для генерации отчетов
- `src/typings.ts` - Типы данных

## Лицензия

MIT
