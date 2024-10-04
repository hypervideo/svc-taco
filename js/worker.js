/*
 * This is a worker doing the encode/decode transformations to a WebRTC PeerConnection using the Insertable Streams API.
 */

'use strict';


const videoDecoder = new VideoDecoder({
    output: (frame) => {
        console.log("Good frame", frame.timestamp, frame);
        postMessage({operation: "videoframe", frame}, [frame]);

    },
    error: (error) => {
        let message = error.message;
        let code = error.name;

        console.error(`Failed to decode: `, message, code);
    }
});


async function initializeDecoder() {
    const config = {
        codec: "av01.0.04M.08",
        hardwareAcceleration: 'prefer-software',
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


let highestSpatialLayer = 3, highestTemporalLayer = 3;

async function handleTransform(operation, readable, writable) {
    if (operation === 'encode') {
        await readable
            .pipeTo(writable);
    } else if (operation === 'decode') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const {temporalIndex, spatialIndex} = encodedFrame.getMetadata();

                controller.enqueue(encodedFrame);

                let {timestamp, data, type} = encodedFrame;

                if (temporalIndex < highestTemporalLayer && spatialIndex < highestSpatialLayer) {
                    console.log("Decoding: ", {temporalIndex, spatialIndex})

                    const chunk = new EncodedVideoChunk({
                        timestamp,
                        data,
                        type,
                    })

                    await videoDecoder.decode(chunk);
                }

            },
        });
        await readable
            .pipeThrough(transformer)
            .pipeTo(writable);
    }
}

// Handler for messages, including transferable streams.
onmessage = async ({data}) => {
    let {operation} = data;
    if (operation === 'encode' || operation === 'decode') {
        let {readable, writable} = data;
        return await handleTransform(operation, readable, writable);
    }

    if (operation === 'layer-change') {
        let {temporal, layer} = data;

        if (temporal) {
            highestTemporalLayer = layer;
        } else {
            highestSpatialLayer = layer;
        }

        console.log("LAYER CHANGE!", data);
    }
};

// Handler for RTCRtpScriptTransforms.
if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer;
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
    };
}
