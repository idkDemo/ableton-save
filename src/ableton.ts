import xpath from 'xpath';

type Version = {
    major: number,
    minor: string,
    revision: string
    schema: number;
}

/**
 * Retrieves the Ableton version from the given XML document.
 * @param doc - The XML document containing the Ableton version.
 * @returns The Ableton version as an object with `major`, `minor`, `revision`, and `schema` properties.
 * @throws {Error} If the Ableton version is not found or if it is not in the expected format.
 */
export function getAbletonVersion(doc: Node): Version {
    let version = xpath.select('/Ableton', doc);

    if (!version || Array.isArray(version) && version.length < 1) throw new Error(`Version not found`);

    if (Array.isArray(version) && version.length > 1) throw new Error(`Expected single node got array of length ${version.length}`);
    if (Array.isArray(version) && version.length === 1) version = version[0];
    if (typeof version !== 'object') throw new Error(`Expected object got ${typeof version}`);

    const major = Number((version as Element).getAttribute('MajorVersion'));
    const minor = (version as Element).getAttribute('MinorVersion');
    const revision = (version as Element).getAttribute('Revision');
    const schema = Number((version as Element).getAttribute('SchemaChangeCount'));

    if (!major || !minor || !revision || !schema) throw new Error(`Version not found`);


    return { major, minor, revision, schema } as Version;
}

/**
 * Changes the value of the NextPointeeId attribute in the given project XML.
 * @param {Node} project - The project XML node.
 * @param {number} nextPointeeId - The new value for the NextPointeeId attribute.
 * @returns {Node} - The updated project XML node.
 * @throws {Error} - If the NextPointeeId attribute is not found, is not an array, or multiple NextPointeeId attributes are found.
 */
export function changeNextPointeeId(project: Node, nextPointeeId: number) {
    const node = xpath.select('/Ableton/LiveSet/NextPointeeId', project);
    if (!node || Array.isArray(node) && node.length < 1) throw new Error('NextPointeeId not found');
    if (!Array.isArray(node)) throw new Error('Expected array');
    if (node.length > 1) throw new Error('Multiple NextPointeeId found');
    if (Number.isNaN(nextPointeeId)) throw new Error('NextPointeeId is ' + nextPointeeId);
    if (node.length === 1) {
        console.debug('Changing NextPointeeId to', nextPointeeId.toString());
        (node[0] as Element).setAttribute('Value', nextPointeeId.toString());
    }

    return project;
}

