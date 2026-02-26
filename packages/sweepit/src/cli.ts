#!/usr/bin/env node

import { initializeToolchain } from './toolchain';

async function run(): Promise<void> {
  const command = process.argv[2];

  if (command === undefined || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command !== 'init') {
    throw new Error(`Unknown command "${command}". Try "sweepit init".`);
  }

  const initialization = await initializeToolchain();

  if (initialization.installedDependencies) {
    process.stdout.write(`Initialized Sweepit toolchain in ${initialization.toolchainDirectory}\n`);
    return;
  }

  process.stdout.write(
    `Sweepit toolchain already initialized in ${initialization.toolchainDirectory}\n`,
  );
}

function printHelp(): void {
  process.stdout.write(`Usage:
  sweepit init

Commands:
  init    Create ~/.sweepit and install rules
`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
