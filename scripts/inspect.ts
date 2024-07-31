import fs from 'fs';
import { join } from 'path';
import { parse, unzip } from '../src/parser';
import { split } from '../src/splitter';
import { ableton_paths } from '../src/paths';

const path = process.argv[2];

if (!path) {
    console.error('Please provide a path to a file');
    process.exit(1);
}


function isAlsFile(path: string): boolean {
    const stats = fs.statSync(path);
    return stats.isFile() && path.endsWith('.als');
}

if (isAlsFile(path)) {
    console.log('The path leads to a .als file');
    const zipped = fs.readFileSync(path);
    const unzipped = unzip(new Uint8Array(zipped));

    Bun.write(join(path, 'parsed.xml'), unzipped);

} else {
    console.log('The path does not lead to a .als file');
}