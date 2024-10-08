/*
 * This is a worker doing the encode/decode transformations to a WebRTC PeerConnection using the Insertable Streams API.
 */

'use strict';


async function handleTransform(operation, readable, writable) {
    if (operation === 'encode') {
        console.log(`inside encode`);
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                console.log("Transforming encoded frame: ", {timestamp, temporalIndex, spatialIndex})
                controller.enqueue(encodedFrame);
            }
        })

        await readable
            .pipeThrough(transformer)
            .pipeTo(writable);
    } else if (operation === 'decode') {
        const transformer = new TransformStream({
            async transform(encodedFrame, controller) {
                const {temporalIndex, spatialIndex, width, height} = encodedFrame.getMetadata();
                const {timestamp, data, type} = encodedFrame;

                console.log("Decoding encodedChunk: ", {timestamp, temporalIndex, spatialIndex})
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
