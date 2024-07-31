import { ungzip, gzip } from "pako";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { XMLValidator } from "fast-xml-parser"
import xmlFormat from 'xml-formatter';


/**
 * Unzips the given data and returns it as a string.
 * 
 * @param data - The data to unzip, either as a Uint8Array or ArrayBuffer.
 * @returns The unzipped data as a string.
 */
export function unzip(data: Uint8Array | ArrayBuffer): string {
    return ungzip(data, { to: "string" });
}

/**
 * Compresses the given string data using gzip compression algorithm.
 * @param data - The string data to be compressed.
 * @returns The compressed data as a Uint8Array or ArrayBuffer.
 */
export function zip(data: string): Uint8Array | ArrayBuffer {
    return gzip(data, { level: 1 });
}

/**
 * Parses the input string and returns a Document object.
 * 
 * @param input - The input string to parse.
 * @returns A Document object representing the parsed XML.
 */
export function parse(input: string): Document {
    return new DOMParser().parseFromString(input, "text/xml");
}

/**
 * Serializes the given XML node to a string.
 * 
 * @param object - The XML node to serialize.
 * @returns The serialized XML as a string.
 */
export function build(object: Node): string {
    return new XMLSerializer().serializeToString(object as Node);
}

/**
 * Validates the given XML source.
 * 
 * @param source The XML source to validate.
 * @returns A boolean indicating whether the XML source is valid or not.
 */
export function validate(source: string) {
    return XMLValidator.validate(source);
}

/**
 * Formats the given XML string.
 * 
 * @param xml - The XML string to format.
 * @returns The formatted XML string.
 */
export function formatXML(xml: string) {
    return xmlFormat(xml);
}