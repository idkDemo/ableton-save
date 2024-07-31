import xpath from 'xpath';

/**
 * Retrieves the first node with the specified name and attribute from the given XML document.
 *
 * @param doc - The XML document to search in.
 * @param name - The name of the node to search for.
 * @param attribute - The attribute of the node to search for.
 * @returns The first node with the specified name and attribute.
 * @throws Error if the node is not found, multiple nodes are found, or the input is invalid.
 */
export function getNodeWithAttribute(doc: Node, name: string, attribute: string) {
    const node = xpath.select(`.//${name}[@${attribute}]`, doc);
    if (!node || Array.isArray(node) && node.length < 1) throw new Error(`${name} with attribute ${attribute} not found`);
    if (Array.isArray(node) && node.length > 1) throw new Error(`Multiple ${name} with attribute ${attribute} found; expected 1 got ${node.length}`);
    if (!Array.isArray(node)) throw new Error('Expected object got string');
    return node[0] as Element;
}

/**
 * Retrieves the first occurrence of a specific XML node by name from the given document.
 * Throws an error if the node is not found, if multiple nodes are found, or if the node is not an object.
 *
 * @param doc - The XML document to search in.
 * @param name - The name of the XML node to retrieve.
 * @returns The first occurrence of the specified XML node as an Element object.
 * @throws Error if the node is not found, if multiple nodes are found, or if the node is not an object.
 */
export function getNode(doc: Node, name: string) {
    const node = xpath.select(`.//${name}`, doc);
    if (!node || Array.isArray(node) && node.length < 1) throw new Error(`${name} not found`);
    if (Array.isArray(node) && node.length > 1) throw new Error(`Multiple ${name} found`);
    if (!Array.isArray(node)) throw new Error('Expected object got string');
    return node[0] as Element;
}

/**
 * Returns an array of child nodes without text nodes.
 *
 * @param node - The parent node.
 * @returns An array of child nodes without text nodes.
 */
export function returnChildsWithoutTextNode(node: Node): Node[] {
    return Array.from(node.childNodes).filter(node => node.nodeType !== 3);
}

export function returnChildsArray(node: Node): Node[] {
    return Array.from(node.childNodes);
}