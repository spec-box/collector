import {spawnSync} from 'node:child_process';
import {JSONReport} from './typings';

export function generateReport(configPath?: string) {
    const args = ['playwright', 'test', '--list', '--reporter=json'];

    if (configPath) {
        args.push('--config', configPath);
    }

    const result = spawnSync('npx', args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe',
        maxBuffer: 100 * 1024 * 1024, // 100 Mb buffer size
    });

    return JSON.parse(result.stdout.toString()) as JSONReport;
}
