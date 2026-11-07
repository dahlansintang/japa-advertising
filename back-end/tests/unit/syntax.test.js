'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '../../..');
const roots = [path.join(projectRoot, 'back-end'), path.join(projectRoot, 'front-end', 'js')];
const ignored = new Set(['node_modules', '.git']);
function collectJavaScript(directory, output = []) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!ignored.has(entry.name)) collectJavaScript(path.join(directory, entry.name), output);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            output.push(path.join(directory, entry.name));
        }
    }
    return output;
}

test('seluruh file JavaScript backend dan frontend lolos pemeriksaan sintaks Node.js', () => {
    const files = roots.flatMap(root => collectJavaScript(root));
    assert.ok(files.length > 0, 'Tidak ditemukan file JavaScript untuk diperiksa.');
    const failures = [];
    for (const file of files) {
        const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
        if (result.status !== 0) failures.push(`${path.relative(projectRoot, file)}\n${result.stderr || result.stdout}`);
    }
    assert.deepEqual(failures, [], failures.join('\n\n'));
});
