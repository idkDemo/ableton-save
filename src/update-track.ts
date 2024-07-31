import xpath from 'xpath';

/**
 * Update every ID in the track; needed for integrating the track into the project; 
 * @param track Track to add
 * @param nextPointeeId Last NextPointeeId value
 * @returns { track: Node, nextPointeeId: number }
 */
export function updateTrack(track: Node, nextPointeeId: number | undefined): { track: Node, nextPointeeId: number } {
    if (!nextPointeeId) throw new Error('No nextPointeeId provided');
    let global_id = nextPointeeId + 1;
    const findings = xpath.select('//*[@Id > 1000]', track);

    if (!findings) throw new Error('No Ids found in the track');
    if (!Array.isArray(findings)) throw new Error('Returned a value that is not an array');

    for (let n of findings) {
        console.debug('Found node:', n.nodeName);

        const id = (n as Element).getAttribute('Id');
        if (!id) throw new Error('No Id found for node: ' + n.nodeName);
        (n as Element).setAttribute('Id', global_id.toString());

        console.debug('New Id:', global_id);
        global_id += 1;
    }

    return { track, nextPointeeId: global_id };
}