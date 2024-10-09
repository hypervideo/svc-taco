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
const worker = new Worker('js/worker.js', { name: 'E2EE worker', type: 'module' });

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

function gotStream(stream) {
    // console.log('Received local stream');
    video1.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
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

// Here we want to decode the encoded video chunk
function setupSenderTransform(sender, layered) {
    if (window.RTCRtpScriptTransform) {
        sender.transform = new RTCRtpScriptTransform(worker, { operation: 'encode' });
        return;
    }

    const senderStreams = sender.createEncodedStreams();
    const { readable, writable } = senderStreams;
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
        receiver.transform = new RTCRtpScriptTransform(worker, { operation: 'decode' });
        return;
    }

    // not a lot of documentation on this
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpReceiver and grep for `createEncodedStreams()`
    const receiverStreams = receiver.createEncodedStreams();
    // console.log(`receiverStreams`, receiverStreams);
    const { readable, writable } = receiverStreams;
    worker.postMessage(
        {
            operation: `decode-layered-${layered}`,
            readable,
            writable,
        },
        [readable, writable],
    );
}

const mediaStreamTrackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });
const writable = mediaStreamTrackGenerator.writable;

worker.postMessage(
    {
        operation: 'init',
        writable,
    },
    [writable],
);

const encodedL3T3Frames = new Map();
const encodedS3T3Frames = new Map();

worker.onmessage = ({ data }) => {
    if (data.operation === 'track-ready') {
        video3.srcObject = new MediaStream([mediaStreamTrackGenerator]);
    }

    if (data.operation === 'encoded-frame') {
        const { layered, timestamp, spatialIndex, temporalIndex, size, type, frameData } = data;

        let frameMap = layered ? encodedL3T3Frames : encodedS3T3Frames;

        if (frameMap.has(timestamp)) {
            const layers = frameMap.get(timestamp);
            layers.push({
                spatialIndex,
                temporalIndex,
                size,
                type,
                frameData,
            });

            frameMap.set(timestamp, layers);
            updateEncodedFrame(timestamp, layers, layered);
        } else {
            frameMap.set(timestamp, [
                {
                    spatialIndex,
                    temporalIndex,
                    size,
                    type,
                    frameData,
                },
            ]);

            appendEncodedFrame(
                timestamp,
                [
                    {
                        spatialIndex,
                        temporalIndex,
                        size,
                        type,
                        frameData,
                    },
                ],
                layered,
            );
        }
    }
};

const bytesS3T3 = document.getElementById('s3t3-frame-bytes');
const bytesL3T3 = document.getElementById('l3t3-frame-bytes');

function updateEncodedFrame(timestamp, frames, layered) {
    const entry = document.querySelector(`#entry-${layered}-${timestamp} ul`);
    if (entry) {
        let bytes = layered ? bytesL3T3 : bytesS3T3;

        entry.innerHTML = '';

        frames.forEach(({ spatialIndex, temporalIndex, size, type, frameData }) => {
            const li = document.createElement('li');
            li.style.padding = '2px';
            li.style.backgroundColor = type === 'delta' ? 'yellow' : 'lawngreen';

            const p = document.createElement('p');
            p.textContent = JSON.stringify(
                {
                    spatialIndex,
                    temporalIndex,
                    size,
                },
                null,
                2,
            );

            li.appendChild(p);
            li.addEventListener('click', (e) => {
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

            entry.appendChild(li);
        });
    }
}

function appendEncodedFrame(timestamp, frames, layered) {
    const container = document.getElementById(layered ? 'l3t3-entries' : 's3t3-entries');
    const frameEntry = document.createElement('div');
    frameEntry.setAttribute('id', `entry-${layered}-${timestamp}`);
    frameEntry.innerHTML = `
            <div><strong>Timestamp ${timestamp}:</strong></div>
              <ul>
                  ${frames
                      .map(
                          (f) => `
                      <li style="background-color: ${f.type === 'delta' ? 'yellow' : 'lawngreen'};">
                           <p>${JSON.stringify(
                               {
                                   spatialIndex: f.spatialIndex,
                                   temporalIndex: f.temporalIndex,
                                   size: f.size,
                               },
                               null,
                               2,
                           )}</p>
                      </li>
                  `,
                      )
                      .join('')}
        </ul>
    `;

    container.appendChild(frameEntry);
}

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
        'S3T3',
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
