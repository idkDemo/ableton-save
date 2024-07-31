
export interface AbletonFile {
    extract: {
        Tracks: string;
        MasterTrack: string;
        PreHearTrack: string;
        Scenes: string;
        Locators: string;
    };
    infos: {
        nextPointer: string;
    };
    analyse: {
        bpm: string;
        key: string;
        plugins: string;
    };
}

export const versions = '/Ableton[@*]'
export const ableton_paths: AbletonFile = {
    extract: {
        Tracks: '/Ableton/LiveSet/Tracks/*',
        MasterTrack: '/Ableton/LiveSet/MasterTrack',
        PreHearTrack: '/Ableton/LiveSet/PreHearTrack',
        Scenes: '/Ableton/LiveSet/Scenes/*',
        Locators: '/Ableton/LiveSet/Locators',

    },
    infos: {
        nextPointer: '/Ableton/LiveSet/NextPointeeId[@Value]',
    },
    analyse: {
        bpm: '/Ableton/LiveSet/Tempo[@Value]',
        key: '/Ableton/LiveSet/Key[@Value]',
        plugins: '/Ableton/LiveSet/Tracks/*/DeviceChain/*/',
    }
}