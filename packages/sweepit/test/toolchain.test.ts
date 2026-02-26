import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { initializeToolchain } from '../src/toolchain';

describe('initializeToolchain', () => {
  it('creates toolchain files and installs dependencies when missing', async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'sweepit-init-test-'));
    const installCalls: Array<{ command: string; args: string[]; cwd: string }> = [];

    await initializeToolchain({
      homeDirectory: tempDirectory,
      runInstallCommand: async (command, args, cwd) => {
        installCalls.push({ command, args, cwd });
        const eslintBinaryPath = path.join(cwd, 'node_modules', '.bin');
        const pluginPackageDirectoryPath = path.join(cwd, 'node_modules', 'eslint-plugin-sweepit');
        await fs.mkdir(eslintBinaryPath, { recursive: true });
        await fs.mkdir(pluginPackageDirectoryPath, { recursive: true });
        await fs.writeFile(path.join(eslintBinaryPath, 'eslint'), '', 'utf8');
        await fs.writeFile(
          path.join(pluginPackageDirectoryPath, 'package.json'),
          '{"name":"eslint-plugin-sweepit"}',
          'utf8',
        );
      },
    });

    const toolchainDirectory = path.join(tempDirectory, '.sweepit');
    const packageJsonPath = path.join(toolchainDirectory, 'package.json');
    const configPath = path.join(toolchainDirectory, 'eslint.config.mjs');

    expect(await readText(packageJsonPath)).toContain('"private": true');
    expect(await readText(configPath)).toContain("import sweepit from 'eslint-plugin-sweepit';");
    expect(installCalls).toHaveLength(1);
    expect(installCalls[0]?.command).toBe('npm');
    expect(installCalls[0]?.cwd).toBe(toolchainDirectory);
    expect(installCalls[0]?.args).toContain('eslint@^9.0.0');
    expect(installCalls[0]?.args).toContain('eslint-plugin-sweepit@latest');
  });

  it('does not reinstall when toolchain is already initialized', async () => {
    const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'sweepit-init-test-'));
    const toolchainDirectory = path.join(tempDirectory, '.sweepit');
    const eslintBinaryPath = path.join(toolchainDirectory, 'node_modules', '.bin');
    const pluginPackageDirectoryPath = path.join(
      toolchainDirectory,
      'node_modules',
      'eslint-plugin-sweepit',
    );
    await fs.mkdir(eslintBinaryPath, { recursive: true });
    await fs.mkdir(pluginPackageDirectoryPath, { recursive: true });
    await fs.writeFile(path.join(eslintBinaryPath, 'eslint'), '', 'utf8');
    await fs.writeFile(
      path.join(pluginPackageDirectoryPath, 'package.json'),
      '{"name":"eslint-plugin-sweepit"}',
      'utf8',
    );

    let installAttempts = 0;
    const result = await initializeToolchain({
      homeDirectory: tempDirectory,
      runInstallCommand: async () => {
        installAttempts += 1;
      },
    });

    expect(result.installedDependencies).toBe(false);
    expect(installAttempts).toBe(0);
  });
});

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}
