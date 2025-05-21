import {spawnSync} from 'node:child_process';

export function generateReport(configPath?: string) {
    const args = ['playwright', 'test', '--list'];

    if (configPath) {
        args.push('--config', configPath);
    }

    return spawnSync('npx', args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
    });
}
