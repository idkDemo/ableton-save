import xpath from "xpath";
import type { AbletonFile } from "./paths";


/**
 * Splits the given document based on the provided paths and returns the mappings, places, and infos.
 *
 * @param doc - The document to split.
 * @param paths - The paths to extract from the document.
 * @returns An array containing the mappings, places, and infos.
 */
export function split(doc: Document, paths: AbletonFile): { mappings: Record<string, Node>, infos: Record<string, string>} {
    // See ableton_paths.ts for the structure of the paths object.
    const mappings: Record<string, Node> = {}; //Maps key/Nodename-id.xml to node
    const infos: Record<string, string> = {}; // Maps the key/attr/Nodename to value

    Object.keys(paths.extract).forEach((k) => {
        const key: keyof typeof paths.extract = k as unknown as keyof typeof paths.extract;
        const nodes = xpath.select((paths.extract[key]), doc);

        // If the node is an array and has more than one element, filter out the non-element nodes and add them to the mappings.
        if (Array.isArray(nodes) && nodes.length > 1) {
            const filtered: Element[] = nodes.filter((n) => n.nodeType === n.ELEMENT_NODE) as unknown as Element[];
            filtered.forEach((n, i) => {
                try {
                    if (n.nodeType === n.ELEMENT_NODE) {
                        console.debug('[Splitter/Tracks]', n.nodeName, 'with id:', n.getAttribute('Id'));


                        if (key === 'Tracks') {
                            console.debug('[Splitter/Tracks]PreviousTrack', n.previousSibling?.nodeName, n.previousSibling?.nodeType);
                            n.setAttribute('PreviousTrack', filtered[i - 1]?.getAttribute('Id') ?? '-1');
                        }

                        mappings[`${key}/${n.nodeName}-${(n as Element).getAttribute('Id')}.xml`] = n;
                    }
                } catch (e) {
                    console.error("Error while processing", key, "for node", n.nodeName, "type", n.nodeType)
                    throw e
                }
            })
        } 
        // If the node is an array and has only one element, add it to the mappings.
        else if (Array.isArray(nodes) && nodes.length === 1) {
            mappings[`${key}/${nodes[0].nodeName}.xml`] = nodes[0] as Node;
        }
    })
    
    Object.keys(paths.infos).forEach(k => {
        const key: keyof typeof paths.infos = k as unknown as keyof typeof paths.infos;

        const nodes = xpath.select(paths.infos[key], doc);
        if (Array.isArray(nodes) && nodes.length >= 1) {
            for (let n of nodes as unknown as Element[]) {
                if (n.nodeType === n.ELEMENT_NODE) {
                    for (let attr = 0; attr < n.attributes.length; attr++) {
                        console.debug(`${key}/${attr}/${n.nodeName}`, n.attributes.item(attr)?.name, n.attributes.item(attr)?.value);
                        infos[`${key}/${attr}/${n.nodeName}`] = n.attributes.item(attr)?.value || '';
                    }
                }
            }
        } else if (nodes && typeof nodes === 'object' && !Array.isArray(nodes) && nodes.nodeType === nodes.ELEMENT_NODE) {
            let node: Element = nodes as Element;
            if (node.nodeType !== nodes.ELEMENT_NODE) node = nodes.firstChild! as Element; //Unwrap if node is typeof Document
            if (node.nodeType !== node.ELEMENT_NODE) throw new Error('Expected element node');
            for (let attr = 0; attr < node.attributes.length; attr++) {
                console.debug(`[Splitter/Info] ${key}/${attr}/${node.nodeName}`, node.attributes.item(attr)?.name, node.attributes.item(attr)?.value);
                infos[`${key}/${attr}/${node.nodeName}`] = node.attributes.item(attr)?.value || '';
            }
        } else throw new Error('Invalid node or empty;');
    })
    return {mappings, infos};
}

