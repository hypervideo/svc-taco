'use strict';

// non negotiable constants
const av1Profile = 'video/av01.0.04M.08';

const spatial240pVideoElement = document.getElementById('spatial-240-video');
const spatial480pVideoElement = document.getElementById('spatial-480-video');
const spatial720pVideoElement = document.getElementById('spatial-720-video');

const spatial240pRemoteVideoElement = document.getElementById('spatial-240-remote-video');
const spatial480pRemoteVideoElement = document.getElementById('spatial-480-remote-video');
const spatial720pRemoteVideoElement = document.getElementById('spatial-720-remote-video');

const spatial240pWebCodecVideoElement = document.getElementById('spatial-240-webcodec-video');
const spatial480pWebCodecVideoElement = document.getElementById('spatial-480-webcodec-video');
const spatial720pWebCodecVideoElement = document.getElementById('spatial-720-webcodec-video');

const mediaStreamTrackGenerator240p = new MediaStreamTrackGenerator({kind: 'video'});
const mediaStreamWritable240p = mediaStreamTrackGenerator240p.writable;

const mediaStreamTrackGenerator480p = new MediaStreamTrackGenerator({kind: 'video'});
const mediaStreamWritable480p = mediaStreamTrackGenerator480p.writable;

const mediaStreamTrackGenerator720p = new MediaStreamTrackGenerator({kind: 'video'});
const mediaStreamWritable720p = mediaStreamTrackGenerator720p.writable;


let resolutions = [
    {
        title: "240p",
        width: 320,
        height: 240,
        videoElement: spatial240pVideoElement,
        stream: null,
        videoPipe: null,
        remoteStream: null,
        remoteVideoElement: spatial240pRemoteVideoElement,
        webCodecVideoElement: spatial240pWebCodecVideoElement,
        webCodecTrackGenerator: mediaStreamTrackGenerator240p,
        webCodecWritable: mediaStreamWritable240p,
        scaleResolutionDownBy: 4.5,
        scalabilityMode: 'L1T3',
    },
    {
        title: "480p",
        width: 640,
        height: 480,
        videoElement: spatial480pVideoElement,
        stream: null,
        videoPipe: null,
        remoteStream: null,
        remoteVideoElement: spatial480pRemoteVideoElement,
        webCodecVideoElement: spatial480pWebCodecVideoElement,
        webCodecTrackGenerator: mediaStreamTrackGenerator480p,
        webCodecWritable: mediaStreamWritable480p,
        scaleResolutionDownBy: 2.25,
        scalabilityMode: 'L1T3',
    },
    {
        title: "720p",
        width: 1280,
        height: 720,
        videoElement: spatial720pVideoElement,
        stream: null,
        videoPipe: null,
        remoteStream: null,
        remoteVideoElement: spatial720pRemoteVideoElement,
        webCodecVideoElement: spatial720pWebCodecVideoElement,
        webCodecTrackGenerator: mediaStreamTrackGenerator720p,
        webCodecWritable: mediaStreamWritable720p,
        scaleResolutionDownBy: 1.5,
        scalabilityMode: 'L1T3',
    },
];


// metrics

const res240pBytesElement = document.getElementById('res-240-bytes');
const res480pBytesElement = document.getElementById('res-480-bytes');
const res720pBytesElement = document.getElementById('res-720-bytes');

const resTotalBytesElement = document.getElementById('res-total-bytes');

let res240pBytes = 0, res480pBytes = 0, res720pBytes = 0, resTotalBytes = res240pBytes + res480pBytes + res720pBytes;

// connection logic
const worker = new Worker('./worker.js', {name: 'E2EE worker', type: 'module'});

for (let idx = 0; idx <= resolutions.length - 1; idx++) {
    const {webCodecWritable: writable, title} = resolutions[idx];

    worker.postMessage({
        operation: `init-${title}`,
        writable
    }, [writable])
}

worker.onmessage = async ({data}) => {
    const {operation} = data;

    if (operation.startsWith('track-ready')) {
        const resolutionMessage = operation.split('-')[2];

        let idx;
        switch (resolutionMessage) {
            case '240p':
                idx = 0;
                break;

            case '480p':
                idx = 1;
                break;

            case '720p':
                idx = 2;
                break;

            default:
                throw new Error(`Unsupported resolution: ${resolutionMessage}`);
        }

        const {webCodecVideoElement, webCodecTrackGenerator} = resolutions[idx];
        webCodecVideoElement.srcObject = new MediaStream([webCodecTrackGenerator]);
    }


    if (operation === 'onTransformFrame') {
        console.log("received");
        const {resolution, encodedVideoChunk} = data;

        const {byteLength} = encodedVideoChunk;


        switch (resolution) {
            case '240p':
                res240pBytes += byteLength;
                res240pBytesElement.innerText = res240pBytes.toLocaleString()
                break;

            case '480p':
                res480pBytes += byteLength;
                res480pBytesElement.innerText = res480pBytes.toLocaleString();
                break;

            case '720p':
                res720pBytes += byteLength;
                res720pBytesElement.innerText = res720pBytes.toLocaleString();
                break;

            default:
                throw new Error(`Unsupported resolution: ${resolution}`);
        }


        resTotalBytes += byteLength;
        resTotalBytesElement.innerText = resTotalBytes.toLocaleString();

    }
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case '1': {
            e.preventDefault();
            !startButton.disabled && start();
            break;
        }
        case '2': {
            e.preventDefault();
            !callButton.disabled && call();
            break;
        }
        case '3': {
            e.preventDefault();
            !hangupButton.disabled && hangup();
            break;
        }
        default:
            break;
    }
});

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

async function requestLocalStream(resolution) {
    let {width: videoWidth, height: videoHeight, videoElement, title, scalabilityMode} = resolution;

    const options = {
        audio: false,
        video: {videoWidth, videoHeight}
    };

    let stream = await navigator.mediaDevices.getUserMedia(options);
    console.log("Get user media: ", title, {videoWidth, videoHeight});
    videoElement.srcObject = stream;
    resolution.stream = stream;

    try {
        const {supported, smooth, powerEfficient} = await navigator.mediaCapabilities.encodingInfo({
            type: 'webrtc',
            video: {
                contentType: av1Profile,
                width: videoWidth,
                height: videoHeight,
                bitrate: 10000,
                framerate: 29.97,
                scalabilityMode,
            }
        });
    } catch (e) {
        throw new Error(`Failed to configure WebRTC: ${e}`);
    }
}

async function start() {
    startButton.disabled = true;

    for (let idx = 0; idx <= resolutions.length - 1; idx++) {
        const resolution = resolutions[idx];
        await requestLocalStream(resolution);
    }

    callButton.disabled = false;
}

async function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    for (let idx = 0; idx <= resolutions.length - 1; idx++) {
        let resolution = resolutions[idx];

        console.log(`localStream`, resolution.stream);

        resolution.videoPipe = new VideoPipe(
            resolution.stream,
            true,
            true,
            (e) => {
                const receiverStreams = e.receiver.createEncodedStreams();
                const {readable, writable} = receiverStreams;
                worker.postMessage(
                    {
                        operation: `decode-${resolution.title}`,
                        readable,
                        writable,
                    }, [readable, writable]);

                console.log(`e.streams[0]`, e.streams[0]);

                resolution.remoteVideoElement.srcObject = e.streams[0];
            },
            resolution.scalabilityMode,
            resolution.scaleResolutionDownBy
        );

        resolution.videoPipe.pc1.getSenders().forEach((s) => {
            const senderStreams = s.createEncodedStreams();
            const {readable, writable} = senderStreams;

            worker.postMessage({
                operation: `encode-${resolution.title}`,
                readable,
                writable
            }, [readable, writable])
        });

        await resolution.videoPipe.negotiate();
    }
}

async function hangup() {
    for (let idx = 0; idx <= resolutions.length - 1; idx++) {
        let resolution = resolutions[idx];
        resolution.videoPipe.close();
    }

    hangupButton.disabled = true;
    callButton.disabled = false;
}