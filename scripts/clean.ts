import fs from 'fs';
import { join } from 'path';

function deleteFolderRecursive(path: string) {
    if (fs.existsSync(path)) {
        fs.rmSync(path, {  recursive: true, force: true });
    }
}

const path = join(__dirname, '..', 'data');
const names = ['1.base', '2.to-combine', '3.combined'];
for (let name of names) {
    console.log('Deleting', path);
    deleteFolderRecursive(join(path, name));

    const sourcePath = join(path, '99.clean');
    const destinationPath = join(path, name);
    console.log('Copying', sourcePath, 'to', destinationPath);
    fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
}
