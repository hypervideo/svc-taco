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


async function handleTransform(operation, readable, writable) {
    if (operation === 'encode') {
        await readable
            .pipeTo(writable);
    } else if (operation === 'decode') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const {temporalIndex: temporal, spatialIndex: spatial} = encodedFrame.getMetadata();

                let {timestamp, data, type} = encodedFrame;

                // Uncomment this to see the temporal base layer being served!
                // if (temporal !== 0) {
                //     return;
                // }
                // if (spatial !== 0) {
                //     return;
                // }

                console.log(`temporal: ${temporal}, spatial: ${spatial}`)

                const chunk = new EncodedVideoChunk({
                    timestamp,
                    data,
                    type,
                })

                await videoDecoder.decode(chunk);
                controller.enqueue(encodedFrame);
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
};

// Handler for RTCRtpScriptTransforms.
if (self.RTCTransformEvent) {
    self.onrtctransform = (event) => {
        const transformer = event.transformer;
        handleTransform(transformer.options.operation, transformer.readable, transformer.writable);
    };
}
