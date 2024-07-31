import { join } from 'path';
import fs from 'fs';
import { build, parse, unzip, zip, formatXML, validate } from '../src/parser';
import { split } from '../src/splitter';
import { ableton_paths } from '../src/paths';
import { combine } from '../src/combiner';


const path = join(__dirname, '..', 'data');
const names = ['1.base', '2.to-combine', '3.combined'];


const tracks: Node[] = [];
const base_file = join(path, names[0], 'project.als');
console.log('[MAIN] Processing', base_file);
const base_zipped = fs.readFileSync(base_file);
const base_unzipped = unzip(new Uint8Array(base_zipped));
const base_parsed = parse(base_unzipped);
const base_splited = split(base_parsed, ableton_paths);

Object.entries(base_splited.mappings).forEach(([k, v]) => {
    if(k.split('/')[0] === 'Tracks') {
        tracks.push(v);
    }
});

const from_file = join(path, names[0], 'project.als');
console.log('[MAIN] Processing', from_file);
const from_zipped = fs.readFileSync(base_file);
const from_unzipped = unzip(new Uint8Array(from_zipped));
const from_parsed = parse(from_unzipped);
const from_splited = split(from_parsed, ableton_paths);

Object.entries(from_splited.mappings).forEach(([k, v]) => {
    if(k.split('/')[0] === 'Tracks') {
        (v as Element).setAttribute('Merged', 'true');
        tracks.push(v);
    }
});

const combined_path = join(path, names[2], 'project.als');
const dest = join(path, names[2], 'combined.als');
const xml_dest = join(path, names[2], 'combined.xml');

const file = fs.readFileSync(combined_path);
const unzipped = unzip(new Uint8Array(file));
const parsed = parse(unzipped);
const combined = combine(parsed, tracks);

const builed = build(combined);
const validated = validate(builed);
if(!validated) throw validated;
const formated = formatXML(builed);

Bun.write(xml_dest, formated);
const final = zip(formated);
Bun.write(dest, final);

console.log('Success!');