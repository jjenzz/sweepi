#!/usr/bin/env node

import { initializeToolchain, runSweepi } from './toolchain';

async function run(): Promise<void> {
  const [firstArgument, ...restArguments] = process.argv.slice(2);

  if (firstArgument === undefined || firstArgument === '--help' || firstArgument === '-h') {
    printHelp();
    return;
  }

  if (firstArgument === 'init') {
    const forceReset = parseForceResetOption(restArguments);
    const initialization = await initializeToolchain({
      onStatus: logStatus,
      forceReset,
    });

    if (initialization.installedDependencies) {
      process.stdout.write(
        `Initialized Sweepi toolchain in ${initialization.toolchainDirectory}\n`,
      );
      return;
    }

    process.stdout.write(
      `Sweepi toolchain already initialized in ${initialization.toolchainDirectory}\n`,
    );
    return;
  }

  const runArguments = [firstArgument, ...restArguments];
  const parsedRunOptions = parseRunOptions(runArguments);

  const lintExitCode = await runSweepi(parsedRunOptions.projectDirectory, {
    onStatus: logStatus,
    all: parsedRunOptions.all,
    files: parsedRunOptions.files,
  });
  process.exitCode = lintExitCode;
}

function printHelp(): void {
  process.stdout.write(`Usage:
  sweepi [project-dir] [--all]
  sweepi [project-dir] --file <path> [--file <path> ...]
  sweepi init

Commands:
  [project-dir]    Project directory to lint (default: current directory)
  --file <path>    Lint specific file(s), repeatable
  --all            Run eslint on all ts/tsx files
  init [--force, -f]    Create ~/.sweepi and install rules

Tip:
  For faster repeated runs, install globally: npm install --global sweepi
`);
}

function logStatus(message: string): void {
  process.stdout.write(`${message}\n`);
}

function parseForceResetOption(argumentsList: string[]): boolean {
  let forceReset = false;

  for (const argument of argumentsList) {
    if (argument === '--force' || argument === '-f') {
      forceReset = true;
      continue;
    }

    throw new Error(`Unknown init option "${argument}". Try "sweepi --help".`);
  }

  return forceReset;
}

interface ParsedRunOptions {
  projectDirectory: string;
  all: boolean;
  files: string[];
}

interface ParsedRunArgumentResult {
  nextOptions: ParsedRunOptions;
  consumedNextArgument: boolean;
}

interface ParsedFileArgumentResult {
  filePath: string;
  consumedNextArgument: boolean;
}

function isFileArgument(argument: string): boolean {
  return argument === '--file' || argument.startsWith('--file=');
}

function parseFileArgument(
  argument: string,
  nextArgument: string | undefined,
): ParsedFileArgumentResult {
  if (argument === '--file') {
    if (nextArgument === undefined || nextArgument.startsWith('-')) {
      throw new Error('Missing value for "--file". Try "sweepi --help".');
    }

    return {
      filePath: nextArgument,
      consumedNextArgument: true,
    };
  }

  const filePath = argument.slice('--file='.length);
  if (filePath.length === 0) {
    throw new Error('Missing value for "--file". Try "sweepi --help".');
  }

  return {
    filePath,
    consumedNextArgument: false,
  };
}

function parseRunArgument(
  argument: string,
  nextArgument: string | undefined,
  currentOptions: ParsedRunOptions,
): ParsedRunArgumentResult {
  if (argument === '--all') {
    return {
      nextOptions: {
        ...currentOptions,
        all: true,
      },
      consumedNextArgument: false,
    };
  }

  if (isFileArgument(argument)) {
    const parsedFileArgument = parseFileArgument(argument, nextArgument);

    return {
      nextOptions: {
        ...currentOptions,
        files: [...currentOptions.files, parsedFileArgument.filePath],
      },
      consumedNextArgument: parsedFileArgument.consumedNextArgument,
    };
  }

  if (argument.startsWith('-')) {
    throw new Error(`Unknown flag "${argument}". Try "sweepi --help".`);
  }

  if (currentOptions.projectDirectory !== '.') {
    throw new Error(`Unexpected argument "${argument}". Try "sweepi --help".`);
  }

  return {
    nextOptions: {
      ...currentOptions,
      projectDirectory: argument,
    },
    consumedNextArgument: false,
  };
}

function parseRunOptions(argumentsList: string[]): ParsedRunOptions {
  let parsedOptions: ParsedRunOptions = {
    projectDirectory: '.',
    all: false,
    files: [],
  };

  for (let argumentIndex = 0; argumentIndex < argumentsList.length; argumentIndex += 1) {
    const argument = argumentsList[argumentIndex];
    if (argument === undefined) continue;

    const nextArgument = argumentsList[argumentIndex + 1];
    const parseResult = parseRunArgument(argument, nextArgument, parsedOptions);
    parsedOptions = parseResult.nextOptions;

    if (parseResult.consumedNextArgument) {
      argumentIndex += 1;
    }
  }

  if (parsedOptions.all && parsedOptions.files.length > 0) {
    throw new Error('Flags "--all" and "--file" cannot be used together. Try "sweepi --help".');
  }

  return parsedOptions;
}

try {
  await run();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
