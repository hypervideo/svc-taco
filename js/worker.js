/*
 * This is a worker doing the encode/decode transformations to add end-to-end
 * encryption to a WebRTC PeerConnection using the Insertable Streams API.
 */

'use strict';
let currentCryptoKey;
let useCryptoOffset = true;
let currentKeyIdentifier = 0;

// If using crypto offset (controlled by a checkbox):
// Do not encrypt the first couple of bytes of the payload. This allows
// a middle to determine video keyframes or the opus mode being used.
// For VP8 this is the content described in
//   https://tools.ietf.org/html/rfc6386#section-9.1
// which is 10 bytes for key frames and 3 bytes for delta frames.
// For opus (where encodedFrame.type is not set) this is the TOC byte from
//   https://tools.ietf.org/html/rfc6716#section-3.1
// TODO: make this work for other codecs.
//
// It makes the (encrypted) video and audio much more fun to watch and listen to
// as the decoder does not immediately throw a fatal error.
const frameTypeToCryptoOffset = {
    key: 10,
    delta: 3,
    undefined: 1,
};

function dump(encodedFrame, direction, max = 16) {
    const data = new Uint8Array(encodedFrame.data);
    let bytes = '';
    for (let j = 0; j < data.length && j < max; j++) {
        bytes += (data[j] < 16 ? '0' : '') + data[j].toString(16) + ' ';
    }
}

let scount = 0;

const init = {
    output: (frame) => {
        console.log("Good frame", frame.timestamp, frame);
    },
    error: (error) => {
        let message = error.message;
        let code = error.name;

        console.error(`Failed to decode: `, message, code);
    }
};

const videoDecoder = new VideoDecoder(init);


async function initializeDecoder() {
    const config = {
        codec: "av01.2.15M.10.0.100.09.16.09.0",
    }

    try {
        const support = await VideoDecoder.isConfigSupported(config);

        if (support.supported) {
            console.log("Video Decoder configuration is supported:", support.config);
            videoDecoder.configure(support.config);
        } else {
            console.error("Configuration is not supported");
        }
    } catch (e) {
        console.error("Something went wrong when checking if isConfigSupported")
    }
}

initializeDecoder();

function encodeFunction(encodedFrame, controller) {
    if (scount++ < 30) { // dump the first 30 packets.
        dump(encodedFrame, 'send');
    }

    const {temporalIndex: temporal, spatialIndex: spatial} = encodedFrame.getMetadata();
    let {timestamp, data, type} = encodedFrame;

    // console.log('\nencoded frame', {timestamp, temporal, spatial});

    const chunk = new EncodedVideoChunk({
        timestamp,
        data,
        type,
    })

    // ruling out saturated queue size
    // console.log("decode queue size at", timestamp, videoDecoder.decodeQueueSize);
    videoDecoder.decode(chunk);
    controller.enqueue(encodedFrame);
}

let rcount = 0;

function decodeFunction(encodedFrame, controller) {
    if (rcount++ < 30) { // dump the first 30 packets
        dump(encodedFrame, 'recv');
    }

    // const metadata = encodedFrame.getMetadata();
    // console.log(
    //     "frame==\n\t", performance.now().toFixed(2),
    //     "\n\tTemporal Index", metadata.temporalIndex,
    //     "\n\t Spatial Index:", metadata.spatialIndex)

    const view = new DataView(encodedFrame.data);
    //   console.log("encoded frame data: ", view.byteLength);

    controller.enqueue(encodedFrame);
}

function handleTransform(operation, readable, writable) {
    if (operation === 'encode') {
        const transformStream = new TransformStream({
            transform: encodeFunction,
        });
        readable
            .pipeThrough(transformStream)
            .pipeTo(writable);
    } else if (operation === 'decode') {
        const transformStream = new TransformStream({
            transform: decodeFunction,
        });
        readable
            .pipeThrough(transformStream)
            .pipeTo(writable);
    }
}

// Handler for messages, including transferable streams.
onmessage = (event) => {
    if (event.data.operation === 'encode' || event.data.operation === 'decode') {
        return handleTransform(event.data.operation, event.data.readable, event.data.writable);
    }
    if (event.data.operation === 'setCryptoKey') {
        if (event.data.currentCryptoKey !== currentCryptoKey) {
            currentKeyIdentifier++;
        }
        currentCryptoKey = event.data.currentCryptoKey;
        useCryptoOffset = event.data.useCryptoOffset;
    }
};

// Handler for RTCRtpScriptTransforms.
if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer;
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
    };
}
