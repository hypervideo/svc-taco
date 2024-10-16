'use strict';

/* global RTCRtpScriptTransform */
/* global VideoPipe */

const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');
const video2a = document.querySelector('video#video2a');
const video3 = document.querySelector('video#video3');

video2.addEventListener('resize', () => {
    // console.log(`resize: Remote video size changed to ${video2.videoWidth}x${video2.videoHeight}`);
});

video3.addEventListener('resize', () => {
    // console.log(`resize: Decoder video size changed to ${video3.videoWidth}x${video3.videoHeight}`);
});

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

const banner = document.querySelector('#banner');

const spatialSelect = document.getElementById('spatial');
const temporalSelect = document.getElementById('temporal');

spatialSelect.addEventListener('change', (event) => {
    const spatialLayer = Number(event.target.value);
    // console.log(`Spatial layer changed to: ${spatialLayer}`);

    worker.postMessage({
        operation: 'layer-change',
        temporal: false,
        layer: spatialLayer,
    });
});

temporalSelect.addEventListener('change', (event) => {
    const temporalLayer = Number(event.target.value);
    // console.log(`Temporal layer changed to: ${temporalLayer}`);

    worker.postMessage({
        operation: 'layer-change',
        temporal: true,
        layer: temporalLayer,
    });
});

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

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

let startToEnd;
let secondaryStartToEnd; // this is S3T3

let localStream;
// eslint-disable-next-line no-unused-vars
let remoteStream;

// We use a Worker to transform `Encoded
// See
//   https://developer.mozilla.org/en-US/docs/Web/API/Worker
// for basic concepts.
const worker = new Worker('js/worker.js', {name: 'E2EE worker', type: 'module'});

const supportsSetCodecPreferences =
    window.RTCRtpTransceiver && 'setCodecPreferences' in window.RTCRtpTransceiver.prototype;

let hasEnoughAPIs = !!window.RTCRtpScriptTransform;

if (!hasEnoughAPIs) {
    const supportsInsertableStreams = !!RTCRtpSender.prototype.createEncodedStreams;

    let supportsTransferableStreams = false;
    try {
        const stream = new ReadableStream();
        window.postMessage(stream, '*', [stream]);
        supportsTransferableStreams = true;
    } catch (e) {
        // console.error('Transferable streams are not supported.');
    }
    hasEnoughAPIs = supportsInsertableStreams && supportsTransferableStreams;
}

if (!hasEnoughAPIs) {
    banner.innerText = 'Your browser does not support WebRTC Encoded Transforms. ' + 'This sample will not work.';
    if (adapter.browserDetails.browser === 'chrome') {
        banner.innerText += ' Try with Enable experimental Web Platform features enabled from chrome://flags.';
    }
    startButton.disabled = true;
}

let firstMediaTimestamp;

function gotStream(stream) {
    // console.log('Received local stream');
    video1.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;


    let first = true;

    let firstVideoTrack = stream.getVideoTracks()[0];

    const mediaTrackProcessor = new MediaStreamTrackProcessor({track: firstVideoTrack});
    const reader = mediaTrackProcessor.readable.getReader();
    reader.read().then(({done, value}) => {
        if (done) {
            return;
        }

        if (first) {
            firstMediaTimestamp = value.timestamp;
            console.log("media timestamp: ", firstMediaTimestamp);
            first = false;
        }

    })
}

function gotRemoteStream(stream, videoElement) {
    // console.log('Received remote stream');
    remoteStream = stream;
    videoElement.srcObject = stream;
}

async function start() {
    // console.log('Requesting local stream');
    startButton.disabled = true;
    const options = {
        audio: false,
        video: {
            width: 1280,
            height: 720,
        },
    };
    navigator.mediaDevices
        .getUserMedia(options)
        .then(gotStream)
        .catch(function (e) {
            alert('getUserMedia() failed');
            throw new Error(`getUserMedia() error: ${e}`);
        });

    try {
        let config = {
            type: 'webrtc',
            video: {
                contentType: 'video/av01.0.04M.08',
                scalabilityMode: 'S3T3',
                width: 1280,
                height: 720,
                bitrate: 10000,
                framerate: 29.97,
            },
        };

        await navigator.mediaCapabilities.encodingInfo(config);

        // console.log("encoding info: ", config);
    } catch (e) {
        throw new Error(`Failed to configure WebRTC: ${e}`);
    }
}

function setupSenderTransform(sender, layered) {
    if (window.RTCRtpScriptTransform) {
        sender.transform = new RTCRtpScriptTransform(worker, {operation: 'encode'});
        return;
    }

    const senderStreams = sender.createEncodedStreams();
    const {readable, writable} = senderStreams;
    worker.postMessage(
        {
            operation: `encode-layered-${layered}`,
            readable,
            writable,
        },
        [readable, writable],
    );
}

function setupReceiverTransform(receiver, layered) {
    if (window.RTCRtpScriptTransform) {
        receiver.transform = new RTCRtpScriptTransform(worker, {operation: 'decode'});
        return;
    }

    // not a lot of documentation on this
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpReceiver and grep for `createEncodedStreams()`
    const receiverStreams = receiver.createEncodedStreams();
    // console.log(`receiverStreams`, receiverStreams);
    const {readable, writable} = receiverStreams;
    worker.postMessage(
        {
            operation: `decode-layered-${layered}`,
            readable,
            writable,
        },
        [readable, writable],
    );
}

const mediaStreamTrackGenerator = new MediaStreamTrackGenerator({kind: 'video'});
const writable = mediaStreamTrackGenerator.writable;

worker.postMessage(
    {
        operation: 'init',
        writable,
    },
    [writable],
);


worker.onmessage = ({data}) => {
    if (data.operation === 'track-ready') {
        video3.srcObject = new MediaStream([mediaStreamTrackGenerator]);
    }

    if (data.operation === 'encoded-frame') {
        const {layered, timestamp, spatialIndex, temporalIndex, size, type, frameData} = data;
        let bytes = layered ? bytesL3T3 : bytesS3T3;


        if (layered) {
            const {delta} = data;
            let mediaTimestamp = firstMediaTimestamp + delta;

            // console.log("media timestamp", mediaTimestamp);
        }


        const timestampId = `${layered}-${timestamp}`;
        const timestampLi = document.getElementById(timestampId);

        const frameLi = document.createElement('li');
        frameLi.style.padding = '1px';
        frameLi.style.backgroundColor = type === 'delta' ? 'yellow' : 'lawngreen';
        frameLi.style.cursor = 'pointer';

        const p = document.createElement('p');
        p.textContent = JSON.stringify({
            spatialIndex,
            temporalIndex,
            size,
        }, null, 2)

        frameLi.appendChild(p);
        frameLi.addEventListener('click', (e) => {
            e.preventDefault();

            const byteArray = new Uint8Array(frameData);

            let byteStr = '';

            for (let idx = 0; idx < byteArray.length; idx++) {
                byteStr += byteArray[idx].toString(16).padStart(2, '0') + ' ';
            }

            bytes.innerHTML = `
                    <div style="padding-bottom: 8px;">
                        ${timestamp}, spatial index: ${spatialIndex}, temporal index: ${temporalIndex} 
                    </div>
                    <div>${byteStr}</div>   
                `;
        });


        if (timestampLi) {
            const ul = timestampLi.querySelector('ul');
            ul.appendChild(frameLi);
        } else {
            const containerUl = document.getElementById(layered ? 'l3t3-entries' : 's3t3-entries');

            const timestampLi = document.createElement('li');
            timestampLi.setAttribute('id', timestampId);

            const ul = document.createElement('ul');
            ul.appendChild(frameLi);
            const span = document.createElement('strong');
            span.innerText = `${timestamp}`;
            timestampLi.appendChild(span);
            timestampLi.appendChild(ul);
            containerUl.appendChild(timestampLi);
        }
    }
};

const bytesS3T3 = document.getElementById('s3t3-frame-bytes');
const bytesL3T3 = document.getElementById('l3t3-frame-bytes');

async function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    startToEnd = new VideoPipe(
        localStream,
        true,
        true,
        (e) => {
            setupReceiverTransform(e.receiver, true);

            if (!supportsSetCodecPreferences) {
                throw new Error(`Codec is not supported`);
            }

            gotRemoteStream(e.streams[0], video2);
        },
        'L3T3',
    );
    startToEnd.pc1.getSenders().forEach((s) => setupSenderTransform(s, true));
    await startToEnd.negotiate();

    secondaryStartToEnd = new VideoPipe(
        localStream,
        true,
        true,
        (e) => {
            setupReceiverTransform(e.receiver, false);

            if (!supportsSetCodecPreferences) {
                throw new Error(`Codec is not supported`);
            }

            gotRemoteStream(e.streams[0], video2a);
        },
        'L1T3',
    );
    secondaryStartToEnd.pc1.getSenders().forEach((s) => setupSenderTransform(s, false));
    await secondaryStartToEnd.negotiate();

    // console.log('Video pipes created');
}

function hangup() {
    // console.log('Ending call');

    console.log(encodedL3T3Frames);
    startToEnd.close();
    secondaryStartToEnd.close();
    hangupButton.disabled = true;
    callButton.disabled = false;
}
