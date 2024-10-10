function parseOBUHeader(byte) {
    return {
        forbiddenBit: (byte >> 7) & 0b1,
        type: (byte >> 3) & 0b1111,
        extensionFlag: (byte >> 2) & 0b1,
        hasSize: (byte >> 1) & 0b1,
        reserved1bit: byte & 0b1,
    };
}

function parseOBUExtensionHeader(byte) {
    return {
        temporalId: (byte >> 5) & 0b111,
        spatialId: (byte >> 3) & 0b11,
        reserved3Bits: byte & 0b111,
    };
}