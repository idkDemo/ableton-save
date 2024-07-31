import xpath from 'xpath';
import { getNode, getNodeWithAttribute } from './utils';
import { changeNextPointeeId } from './ableton';

type intermediatePosition = {
    id: number,
    previous: number,
    group: number,
    is_group: boolean,
    is_merged: boolean,
    node: Element
}

/**
 * Combines the specified nodes from the given document with the provided files.
 * 
 * @param doc - The document node to combine with the files.
 * @param files - An object containing the files to combine, where the keys represent the node paths and the values are arrays of nodes.
 * @returns The combined document node.
 * @throws {Error} If a node is not found, if the node is not an object, if multiple nodes are found for a key, or if a node has no appendChild method.
 */
export function combine(doc: Node, tracks: Node[]): Node {
    if (!doc) throw new Error('Document not found'); //Ensure no runtime error if doc is null (thanks javascript)

    const target = getNode(doc, 'Tracks'); // Retrive the Track node in the ableton project; see paths.ts and readme for more info

    if (typeof target.appendChild === 'undefined') throw new Error('Node has no appendChild method');

    //Removing every track already present in the project;
    while (target.childNodes.length > 0) {
        target.removeChild(target.firstChild!);
    }

    try {
        console.debug('[Combiner] Merging tracks...')

        let max_track_id = Math.max(...tracks.map(n => Number((n as Element).getAttribute('Id')) ?? 0));
        console.debug('[Combiner] Max Track Id is:', max_track_id)

        const base_tracks: intermediatePosition[] = [];
        let tracks_to_merge: intermediatePosition[] = [];

        //Transform track node to intermediatePosition object;
        tracks.forEach((n, i) => {
            if (n.nodeType === n.DOCUMENT_NODE) n = n.firstChild!;
            const id = (n as Element).getAttribute('Id');
            if (!id) throw new Error('Id not found');

            const previous = (n as Element).hasAttribute('PreviousTrack') ? (n as Element).getAttribute('PreviousTrack') : "-1";
            if (!previous) throw new Error('Previous not found');

            const TrackGroupId = getNodeWithAttribute(n, 'TrackGroupId', 'Value').getAttribute('Value');
            if (!TrackGroupId) throw new Error('Group not found');

            const is_group = n.nodeName === 'GroupTrack';
            const is_merged = (n as Element).hasAttribute('Merged') ? true : false;
            const result = { id: Number(id), previous: Number(previous), group: Number(TrackGroupId), is_group, is_merged, node: n as Element }
            
            if(is_merged) tracks_to_merge.push(result);
            else base_tracks.push(result);
        });

        //Group track to its GroupTrack parent;
        // Look like: {81: [groupTrack, MidiTrack, AudioTrack....], 82: [groupTrack, MidiTrack, AudioTrack....]}
        const grouped_track: Record<number, intermediatePosition[]> = {};
        let grouped_track_to_merge: Record<number, intermediatePosition[]> = {};

        base_tracks.forEach((node) => {
            //If it's a group track, we group it with its children and placed it at the beginning of the array
            if (node.is_group)
                return Array.isArray(grouped_track[node.id]) ? grouped_track[node.id].unshift(node) : grouped_track[node.id] = [node];
            //If it's a child of a group track, we group it with its siblings
            if (node.group > 0) return Array.isArray(grouped_track[node.group]) ? grouped_track[node.group].push(node) : grouped_track[node.group] = [node];
            return grouped_track[node.id] = [node];
        })
        tracks_to_merge.forEach((node) => {
            if (node.is_group)
                return Array.isArray(grouped_track_to_merge[node.id]) ? grouped_track_to_merge[node.id].unshift(node) : grouped_track_to_merge[node.id] = [node];
            if (node.group > 0) return Array.isArray(grouped_track_to_merge[node.group]) ? grouped_track_to_merge[node.group].push(node) : grouped_track_to_merge[node.group] = [node];
            return grouped_track_to_merge[node.id] = [node];
        });

        const merged: Record<string, intermediatePosition[]> = {};
        //Maps keept track of old group id and new group if from the updated group tracks ids
        //Looks like {81: 92....}
        const maps: Record<string, string> = {};

        Object.entries(grouped_track_to_merge).forEach((packed) => {
            //packed = [group id, track in intermediate representation]
            let id: number = Number(packed[0]);
            let group = packed[1];
            console.debug('[Combiner/Merge] Processing Group id:', id)
            //If a group with that id already exists in the base project
            if (grouped_track[id]) {
                group = group.map((track) => {
                    if (track.is_group) {
                        console.debug("[Combiner/Merge/Group] Updating group id: ", id, " with new id: ", max_track_id + 1)

                        max_track_id += 1;
                        maps[id] = String(max_track_id); //Link the old id to the new one
                        id = max_track_id;

                        track.node.setAttribute('Id', String(id));
                        track.id = id;

                        const TrackGroupId = getNodeWithAttribute(track.node, 'TrackGroupId', 'Value')
                        const belongs_to_groupId = TrackGroupId.getAttribute('Value');
                        if(belongs_to_groupId && Number(belongs_to_groupId) > 0 && Object.keys(maps).includes(belongs_to_groupId)) {
                            console.debug('[Combiner/Merge/Group] Updating parent group:', belongs_to_groupId, 'with new group parent id:', maps[belongs_to_groupId])
                            TrackGroupId.setAttribute('Value', maps[belongs_to_groupId]);
                            track.group = Number(maps[belongs_to_groupId]);
                        }
                    } else {
                        console.debug('[Combiner/Merge] Updating track id:', track.id, 'with new id: ', max_track_id + 1, 'with group id:', id)
                        
                        max_track_id += 1;
                        track.id = max_track_id;
                        track.group = id;
                        track.node.setAttribute('Id', String(max_track_id));

                        const TrackGroupId = getNodeWithAttribute(track.node, 'TrackGroupId', 'Value')
                        TrackGroupId.setAttribute('Value', String(id));
                    }

                    //Updating the name of the track to be conflict-<name>
                    const EffectiveName = getNodeWithAttribute(track.node, 'Name/EffectiveName', 'Value');
                    const UserName = getNodeWithAttribute(track.node, 'Name/UserName', 'Value');

                    const current_name = UserName.getAttribute('Value') && UserName.getAttribute('Value')!.length > 1 ?
                        UserName.getAttribute('Value') :
                        EffectiveName.getAttribute('Value');

                    console.debug('[Combiner/Renamer] Updating track name:', current_name)
                    UserName.setAttribute('Value', "conflict-" + current_name);

                    return track;
                })
            }
            merged[id] = group;
        })

        //Simply push tracks to the merged object if they are not grouped; otherwise check if the group already exists in the merged object and push all tracks to it;
        Object.entries(grouped_track).forEach((packed) => {
            let id: number = Number(packed[0]);
            if (merged[id] && merged[id][0].is_group && packed[1][0].is_group) throw new Error('Grouped track is already grouped'); // We cannot have to group with the same id at this point;
            // If the group already exists in the merged tracks, we push the tracks to it;
            else if (merged[id] && merged[id][0].is_group && !packed[1][0].is_group) merged[id].push(...packed[1]); 
            // If the group already exists in the merged track but don't have a group at the head of the array, we push the GroupTrack to its beginning;
            else if (merged[id] && !merged[id][0].is_group && packed[1][0].is_group) merged[id].unshift(...packed[1]); 
            else merged[id] = packed[1];
        })

        //Reconstruct the tree in the correct order;
        const grouped_array: intermediatePosition[][] = [];
        Object.values(merged).forEach((group) => {
            let belongs_to = group[0].is_group ? group[0].group : group[0].id;
            let pos = grouped_array.findIndex(g => g[0].id === belongs_to);
            if (pos === -1) grouped_array.push(group);
            else {
                grouped_array.splice(pos + 1, 0, group);
            }
        })

        const merged_tracks = grouped_array.flat().map((e) => {
            const n = e.node;

            //Remove every previous track and merged attribute placed by us as it would crach ableton otherwise "Unknown attribute 'Merged' on element '<track>'";
            if (n.hasAttribute('PreviousTrack')) {
                n.removeAttribute('PreviousTrack');
            }
            if (n.hasAttribute('Merged')) {
                n.removeAttribute('Merged');
            }
            return n;
        })

        for (let _node of merged_tracks) {
            console.debug('[Combiner] Appending:', _node!.nodeName, 'to', target.nodeName)
            target.appendChild(_node);
        }

    } catch (e) {
        throw e;
    }

    console.info('[Combiner] Updating pointees...');
    const changed = updatePointee(doc);
    console.info('[Combiner] Pointees updated!')

    return changeNextPointeeId(changed.doc, changed.nextPointer);
}


/**
 * Updates the Id attribute of nodes in the given document.
 * 
 * @param doc - The document containing nodes to be updated.
 * @returns An object with the updated document and the next pointer value.
 * @throws Error if the document is invalid or no nodes are found.
 */
function updatePointee(doc: Node): { nextPointer: number, doc: Node } {
    const nodes = xpath.select('//*[@Id>1000]', doc);
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) throw new Error('Cannot update the project;');
    let nextPointer = 1000;
    for (let node of nodes) {
        nextPointer += 1;
        (node as Element).setAttribute('Id', String(nextPointer));
    }

    return { doc, nextPointer: nextPointer + 1 };
}