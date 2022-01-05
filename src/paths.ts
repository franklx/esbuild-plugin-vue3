import { fileExists } from "./utils";
import { Options } from "./options";
import ts from "typescript";

type Rule = { regex: RegExp, replacement: string }

const rules: Rule[] = [];

/**
 * @returns true if there are any rules to apply, false otherwise.
 */
export async function loadRules(opts: Options): Promise<boolean> {
    if (opts.pathAliases === false) {
        return false;
    }

    if (opts.pathAliases) {
        for (const path in opts.pathAliases) {
            const from = `^${replaceWildcard(path, "(.*)")}$`;
            const to = replaceWildcard(opts.pathAliases[path], "$1");

            rules.push({
                regex: new RegExp(from),
                replacement: to
            });
        }
    } else {
        await loadFromTsconfig();
    }

    return rules.length > 0;
}

async function loadFromTsconfig() {
    if (!await fileExists("tsconfig.json")) {
        return;
    }

    const tsconfig = ts.readConfigFile("tsconfig.json", ts.sys.readFile)?.config;

    if (!tsconfig?.compilerOptions?.paths) {
        return;
    }

    for (const path in tsconfig.compilerOptions.paths) {
        const dests: string[] = tsconfig.compilerOptions.paths[path];

        if (dests.length == 0) {
            continue;
        }

        const from = `^${replaceWildcard(path, "(.*)")}$`;
        const to = replaceWildcard(dests[0], "$1");

        rules.push({
            regex: new RegExp(from),
            replacement: to
        });
    }
}

function replaceWildcard(str: string, repl: string) {
    return str.replace(/\*/g, repl);
}

export function replaceRules(path: string): string {
    for (const rule of rules) {
        path = path.replace(rule.regex, rule.replacement);
    }

    return path;
}