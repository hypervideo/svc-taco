/*
 * This is a worker doing the encode/decode transformations to a WebRTC PeerConnection using the Insertable Streams API.
 */

'use strict';


const videoDecoder = new VideoDecoder({
    output: (frame) => {
        console.log("Good frame", frame.timestamp, frame);
    },
    error: (error) => {
        let message = error.message;
        let code = error.name;

        console.error(`Failed to decode: `, message, code);
    }
});


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


function decodeFunction(videoFrame, controller) {
    controller.enqueue(videoFrame);
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
};

// Handler for RTCRtpScriptTransforms.
if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer;
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
    };
}
