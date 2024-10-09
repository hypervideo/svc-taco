/*
 * This is a worker doing the encode/decode transformations to a WebRTC PeerConnection using the Insertable Streams API.
 */

'use strict';

let timestampCatalog = new Map();
let writer;

const videoDecoder = new VideoDecoder({
    output: async (frame) => {
        let {
            codedHeight,
            codedWidth,
            colorSpace,
            displayHeight,
            displayWidth,
            duration,
            format,
            timestamp,
            visibleRect,
        } = frame;

        // // console.log("Good frame", {timestamp, codedWidth, codedHeight});

        if (timestampCatalog.has(timestamp)) {
            timestampCatalog.set(timestamp, timestampCatalog.get(timestamp) + 1);
            // console.log(`Duplicate timestamp video frame encountered`);
        } else {
            timestampCatalog.set(timestamp, 1);
        }

        await writer.write(frame);
    },
    error: (error) => {
        let message = error.message;
        let code = error.name;

        // console.error(`Failed to decode: `, message, code);
    },
});

async function initializeDecoder() {
    const config = {
        codec: 'av01.0.04M.08',
        hardwareAcceleration: 'prefer-software',
    };

    try {
        const support = await VideoDecoder.isConfigSupported(config);

        if (support.supported) {
            // console.log("Video Decoder configuration is supported:", support.config);
            videoDecoder.configure(support.config);
        } else {
            return new Error('Configuration is not supported');
        }
    } catch (e) {
        throw new Error(`Decoder init error ${e}`);
    }
}

initializeDecoder();

let highestSpatialLayer = 3,
    highestTemporalLayer = 3;

async function handleTransform(operation, readable, writable) {
    if (operation === 'encode-layered-true') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const { temporalIndex, spatialIndex, width, height } = encodedFrame.getMetadata();
                const { timestamp, data, type } = encodedFrame;

                const size = data.byteLength;

                postMessage({
                    operation: 'encoded-frame',
                    layered: true,
                    timestamp,
                    spatialIndex,
                    temporalIndex,
                    frameData: data,
                    size,
                    type,
                });

                controller.enqueue(encodedFrame);
            },
        });

        await readable.pipeThrough(transformer).pipeTo(writable);
    } else if (operation === 'encode-layered-false') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const { temporalIndex, spatialIndex, width, height } = encodedFrame.getMetadata();
                const { timestamp, data, type } = encodedFrame;

                const size = data.byteLength;

                postMessage({
                    operation: 'encoded-frame',
                    layered: false,
                    timestamp,
                    spatialIndex,
                    temporalIndex,
                    frameData: data,
                    size,
                    type,
                });

                if (spatialIndex === 2) {
                    controller.enqueue(encodedFrame);
                }
            },
        });

        await readable.pipeThrough(transformer).pipeTo(writable);
    } else if (operation === 'decode-layered-true') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const { temporalIndex, spatialIndex, width, height } = encodedFrame.getMetadata();
                const { timestamp, data, type } = encodedFrame;

                if (temporalIndex < highestTemporalLayer && spatialIndex < highestSpatialLayer) {
                    // console.log("Decoding encodedChunk: ", {timestamp, temporalIndex, spatialIndex})

                    const chunk = new EncodedVideoChunk({
                        timestamp,
                        data,
                        type,
                    });

                    await videoDecoder.decode(chunk);
                }

                controller.enqueue(encodedFrame);
            },
        });
        await readable.pipeThrough(transformer).pipeTo(writable);
    } else if (operation === 'decode-layered-false') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const { temporalIndex, spatialIndex } = encodedFrame.getMetadata();

                if (spatialIndex === 2) {
                    controller.enqueue(encodedFrame);
                }
            },
        });
        await readable.pipeThrough(transformer).pipeTo(writable);
    }
}

// Handler for messages, including transferable streams.
onmessage = async ({ data }) => {
    let { operation } = data;

    if (operation === 'init') {
        writer = data.writable.getWriter();

        postMessage({
            operation: 'track-ready',
        });
    }

    if (
        operation === 'encode-layered-true' ||
        operation === 'encode-layered-false' ||
        operation === 'decode-layered-true' ||
        operation === 'decode-layered-false'
    ) {
        let { readable, writable } = data;
        return await handleTransform(operation, readable, writable);
    }

    if (operation === 'layer-change') {
        let { temporal, layer } = data;

        if (temporal) {
            highestTemporalLayer = layer;
        } else {
            highestSpatialLayer = layer;
        }

        // console.log("LAYER CHANGE!", data);
    }
};

// Handler for RTCRtpScriptTransforms.
if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer;
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
    };
}
