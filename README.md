# ableton-save
A small repository to present my findings on .als files. Includes some POCs around version management systems for Ableton.

## .als File
Ableton uses a simple XML file compressed with gzip. When unzipped, the file looks like this:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Ableton MajorVersion="5" MinorVersion="11.0_11300" SchemaChangeCount="3" Creator="Ableton Live 11.3.10" Revision="76842d592e1d12e4ac43b605fac2016faa8dd0cf">
    <LiveSet>
        <!-- This is where all the data lives -->
        <Tracks>
        </Tracks>
    </LiveSet>
</Ableton>
```

We can see that the Ableton version is specified via the Major and Minor version. The `SchemaChangeCount` might suggest a major version change in how the XML file is structured, but I haven't confirmed this yet.

## The NextPointer 
The first two child nodes of the `LiveSet` node are:
```xml
<NextPointeeId Value="27406"/>
<OverwriteProtectionNumber Value="2819"/>
```

The `OverwriteProtectionNumber` never seems to change between different versions of the same .als file. I suppose it changes occasionally between different Ableton versions or might appear in a backup file, but this needs more investigation. It doesn't trigger any errors if left untouched or injected into another project.

The important thing is the `NextPointeeId`. Basically, it tracks the next important action Pointee Id. It might be useful for tracking the history of a project, but I haven't tested this thoroughly. From what I've seen, it is important that `NextPointeeId` is greater than 1000 and larger than the largest Pointee Id in the project.

The Pointee Id can be found, for example, in the AudioTrack-83.xml file like this:
```xml
<!-- DeviceChain is where every track's data is stored, such as the time where clips are placed, values of the different VST devices, and track values like gain or panning -->
<DeviceChain>
    <MainSequencer>
        <Pointee Id="1062"/>
    </MainSequencer>
</DeviceChain>
```

This means that if we zip an XML file where every Pointee Id is unique and the largest Pointee Id is smaller than the `NextPointeeId`, Ableton will open the file without any errors.

## Track Order 
Ableton stores each track in the arrangement view order. This means that if a track node like `MidiTrack` is before another `MidiTrack`, it will be placed above the second `MidiTrack` in the arrangement. The order matters and is very important, as `GroupTrack` must be on top of every grouped track (MIDI or audio). Each track has a:
```xml
<TrackGroupId Value="-1"/>
```

If the value equals -1, it means that the track is not grouped. Note that while each track is stored in a flat list, it is represented as a tree in Ableton. A group track that is wrapped by another group must be under the group track, like this:
```
- AudioTrack Id=80; TrackGroupId=-1
- GroupTrack Id=81; TrackGroupId=-1
    - MidiTrack Id=82; TrackGroupId=81
    - GroupTrack Id=83; TrackGroupId=81
        -MidiTrack Id=84; TrackGroupId=83
```

# Applying This to Git

I have included some of the code I wrote in the `./src` folder. I will go into more detail later, but here is the idea I had for using Git (or any CRDT) with Ableton.

We could simply extract each track of the Ableton project to store it separately (like in a file, or as a document in Y.Js for example). This would offer more granularity in resolving conflicts. Combining all the tracks back into an Ableton file is easy by placing them as the child nodes of the `Tracks` node. 
The only important thing is to ensure that the XML file is correctly built, that every track has a unique Id, is correctly placed in the file, and every Pointee Id is greater than 1000 and unique, with the `NextPointeeId` pointing to the next integer to use. 
Performing a 3-way merge (in the case of Git) is easy by making a diff of the different tracks to get any conflict. If a conflict is detected, then add the track by incrementing the total track-id by one and change every Pointee Id to be greater by one each time, updating the `NextPointeeId` by the last `PointeeId` +1. 

- The main problem is that Ableton stores HexValue for each VST inserted in the track, meaning that using a simple text diff tool might not be optimal.
- Another problem is that the master track should be unique, meaning that if a conflict occurs in the master, we should create a new track from scratch to let the user resolve it by hand. 
- It's not that granular, as a small change in the name, a MIDI clip, a parameter, or anything else might create a conflict when merging projects. This could lead to basically duplicating every track of a project. Indicating what causes the conflict is also complex. This needs proper tooling that needs to be built from scratch, but it shouldn't be too difficult. 

The last concern is storing .wav files in the Sample folder, which should be easily addressed by using Git LFS or Y.Js. 

A VCS is useful for keeping track of changes, branching, or collaborative work. It could also make it simpler to collaborate on projects with scripts that ensure every sample is collected, or each track is frozen before pushing to others, etc.


# What I've Done So Far

This is where I will go through every file in the `./src` folder.

Note that I used `xpath` and `xmldom` for manipulating the XML file.

Xml dom: https://www.w3schools.com/xml/met_node_normalize.asp#:~:text=The%20normal%20form%20is%20useful,identical%20when%20saved%20and%20reloaded.
Implemtation: https://github.com/xmldom/xmldom

Xpath: https://www.w3schools.com/xml/xpath_intro.asp
Implemtation: https://github.com/goto100/xpath

*ableton.ts*
This file contains functions for retrieving the Ableton version required for opening the file and a function for updating the `NextPointeeId` node.

*parser.ts*
Contains simple functions for manipulating and validating .als files.

*paths.ts* 
Contains every path of useful nodes in the .als XML representation. It is used with `xpath` in the xpath format.
See [this](https://www.w3schools.com/xml/xpath_syntax.asp)

*update-track.ts*
`UpdateTrack` is a function that takes a track as an XML node as input, finds every Pointee, and updates them to be unique in order to integrate the track into an existing Ableton project.

*utils.ts*
Contains simple functions for manipulating the DOM or the paths.

*splitter.ts*
`Split` is a function that takes paths and extracts nodes from the XML DOM (Ableton Project) in order to store them separately.

*combiner.ts*
`Combine` is a function that takes a list of files and a base XML document and tries to put each node contained in the files back into the document where it belongs.

*./xml/*
I put some parts of an Ableton Project in it to explore it more easily. You can find and AudioTrack, MidiTrack, GroupTrack, Locators, MasterTrack, Scene, PrehearTrack and parsed.xml that is a full project.
Everythings comes from an empty project, there is not clip or vst.


# POC

Here is the instruction to run the POC wich will take every track from ./data/1.base/project.als and combine them with ./data/2.to-combine/project.als and output the xml file and the combined.als into ./data/3.combine;
Meaning that you can modify 1.base or 2.to-combine and see the result in 3.combined.

## 1. Modify 
Modify any of the project.als in 1.base or 2.to-combine and save it as usual.

## 2. Combine
run the command:
`bun poc`
This will split the two project to extract all the tracks from both and then combine them.
You can inspect the console or the combined.xml file to see what's happen exacly. 
*Note that you could do bun ./scripts/inspect.ts <path to a .als file> to extract the xml file;*

## 3. Result
Now if you open combined.als you will see that every track from 2.to-combined as been added with the 1.base and renamed to conflict-<track name>.


## 4. Cleaning
To clean the poc you could run
`bun clean`
This will remove 1.base, 2.to-combine and 3.combined and replaced it with a copy of  99.clean and rename it to the proper step name. 

## At any time 
You can run the command 
`bun ./scripts/split.ts <path to .als>`
To split a track into a folder called Splits with sub folder as Tracks, MasterTrack, PrehearTrack, Locators and Scenes with .xml file in it. 