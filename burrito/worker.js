'use-strict';

let videoDecoder240p, videoDecoder480p, videoDecoder720p, videoDecoderL3T3;

async function setVideoDecoder(resolution, writer) {

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

            if (writer) {
                await writer.write(frame);
            }
        },
        error: (error) => {
            let message = error.message;
            let code = error.name;

            throw new Error(`Failed to decode: ${message}, ${code}`);
        },
    });

    const config = {
        codec: 'av01.0.04M.08',
        hardwareAcceleration: 'prefer-software',
    };

    try {
        const support = await VideoDecoder.isConfigSupported(config);

        if (support.supported) {
            videoDecoder.configure(support.config);
        } else {
            return new Error('Configuration is not supported');
        }
    } catch (e) {
        throw new Error(`Decoder init error ${e}`);
    }

    switch (resolution) {
        case '240p':
            videoDecoder240p = videoDecoder;
            break;
        case '480p':
            videoDecoder480p = videoDecoder;
            break;
        case '720p':
            videoDecoder720p = videoDecoder;
            break;
        case 'L3T3':
            videoDecoderL3T3 = videoDecoder;
            break;
        default:
            throw new Error(`Failed to set video decoder`);
    }
}

async function handleTransform(resolution, readable, writable) {
    const transformer = new TransformStream({
        async transform(encodedFrame, controller) {
            const {temporalIndex, spatialIndex, width, height} = encodedFrame.getMetadata();
            const {timestamp, data, type} = encodedFrame;

            let videoDecoder;

            switch (resolution) {
                case '240p':
                    videoDecoder = videoDecoder240p;
                    break;
                case '480p':
                    videoDecoder = videoDecoder480p;
                    break;
                case '720p':
                    videoDecoder = videoDecoder720p;
                    break;
                case 'L3T3':
                    videoDecoder = videoDecoderL3T3;
                    break;
                default:
                    throw new Error(`Unsupported resolution: ${resolution}`);
            }

            const chunk = new EncodedVideoChunk({
                timestamp,
                data,
                type,
            });

            postMessage({
                operation: `onTransformFrame`,
                resolution,
                encodedVideoChunk: chunk
            });


            await videoDecoder.decode(chunk);

            console.log('transform', {resolution, temporalIndex, spatialIndex, width, height});

            controller.enqueue(encodedFrame);
        }
    })

    await readable.pipeThrough(transformer).pipeTo(writable);
}


// Handler for messages, including transferable streams.
onmessage = async ({data}) => {
    let {operation} = data;

    if (operation.startsWith('init')) {
        const {writable} = data;
        const resolution = operation.split('-')[1];
        console.log(`received init`, {resolution, writable});

        const writer = writable.getWriter();
        await setVideoDecoder(resolution, writer);

        postMessage({
            operation: `track-ready-${resolution}`,
        })
    }


    if (operation.startsWith('encode')) {
        const {readable, writable} = data;
        await readable.pipeTo(writable);
    }

    if (operation.startsWith('decode')) {
        let {readable, writable} = data;

        const resolution = operation.split("-")[1];
        return await handleTransform(resolution, readable, writable);
    }
};

