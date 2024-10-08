'use strict';

/* global RTCRtpScriptTransform */
/* global VideoPipe */

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const image = new Image();
image.src = "potatoe.webp";

let canvasStream;

image.onload = function () {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvasStream = canvas.captureStream(25);
    console.log("Canvas stream captured")
}

const video2 = document.querySelector('video#video2');


const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');


document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case "1": {
            e.preventDefault();
            !startButton.disabled && start();
            break;
        }
        case "2": {
            e.preventDefault();
            !callButton.disabled && call();
            break;
        }
        case "3": {
            e.preventDefault();
            !hangupButton.disabled && hangup();
            break
        }
        default:
            break;
    }
});

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;


let startToEnd;

let localStream;
// eslint-disable-next-line no-unused-vars
let remoteStream;

// We use a Worker to transform `Encoded
// See
//   https://developer.mozilla.org/en-US/docs/Web/API/Worker
// for basic concepts.
const worker = new Worker('worker.js', {name: 'E2EE worker', type: "module"});


const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
    'setCodecPreferences' in window.RTCRtpTransceiver.prototype;

let hasEnoughAPIs = !!window.RTCRtpScriptTransform;

if (!hasEnoughAPIs) {
    const supportsInsertableStreams =
        !!RTCRtpSender.prototype.createEncodedStreams;

    let supportsTransferableStreams = false;
    try {
        const stream = new ReadableStream();
        window.postMessage(stream, '*', [stream]);
        supportsTransferableStreams = true;
    } catch (e) {
        console.error('Transferable streams are not supported.');
    }
    hasEnoughAPIs = supportsInsertableStreams && supportsTransferableStreams;
}


function gotRemoteStream(stream) {
    console.log('Received remote stream');
    remoteStream = stream;
    video2.srcObject = stream;

    console.log("Remote stream tracks:", stream.getTracks());

    video2.play().catch((e) => console.error("Error playing video: ", e));
}

async function start() {
    console.log('Requesting local stream');
    startButton.disabled = true;

    localStream = canvasStream;
    console.log("Canvas stream tracks:", canvasStream.getTracks());
    callButton.disabled = false;

    try {
        let config = {
            type: "webrtc",
            video: {
                contentType: "video/av01.0.04M.08",
                scalabilityMode: "L3T3",
                width: 1280,
                height: 720,
                bitrate: 10000,
                framerate: 29.97,
            }
        }

        await navigator.mediaCapabilities.encodingInfo(config);
        console.log("encoding info: ", config);
    } catch (e) {
        throw new Error(`Failed to configure WebRTC: ${e}`);
    }
}


// Here we want to decode the encoded video chunk
function setupSenderTransform(sender) {
    if (window.RTCRtpScriptTransform) {
        sender.transform = new RTCRtpScriptTransform(worker, {operation: 'encode'});
        return;
    }

    const senderStreams = sender.createEncodedStreams();
    const {readable, writable} = senderStreams;
    console.log(`readable: ${readable}, writable: ${writable}`);
    worker.postMessage({
        operation: 'encode',
        readable,
        writable,
    }, [readable, writable]);
}

function setupReceiverTransform(receiver) {
    if (window.RTCRtpScriptTransform) {
        receiver.transform = new RTCRtpScriptTransform(worker, {operation: 'decode'});
        return;
    }

    // not a lot of documentation on this
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpReceiver and grep for `createEncodedStreams()`
    const receiverStreams = receiver.createEncodedStreams();
    console.log(`receiverStreams`, receiverStreams);
    const {readable, writable} = receiverStreams;
    worker.postMessage({
        operation: 'decode',
        readable,
        writable,
    }, [readable, writable]);
}


function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;

    console.log('Starting call');

    startToEnd = new VideoPipe(localStream, true, true, e => {
        setupReceiverTransform(e.receiver);

        if (!supportsSetCodecPreferences) {
            throw new Error(`Codec is not supported`);
        }

        console.log("remote stream", e.streams[0]);

        gotRemoteStream(e.streams[0]);
    });
    startToEnd.pc1.getSenders().forEach(setupSenderTransform);
    startToEnd.negotiate();

    console.log('Video pipes created');
}

function hangup() {
    console.log('Ending call');
    startToEnd.close();
    hangupButton.disabled = true;
    callButton.disabled = false;
}


