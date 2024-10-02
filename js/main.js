'use strict';

/* global RTCRtpScriptTransform */
/* global VideoPipe */

const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

const banner = document.querySelector('#banner');

window.focus();

document.addEventListener('keydown', (e) => {
    e.preventDefault();

    switch (e.key) {
        case "1": {
            !startButton.disabled && start();
            break;
        }
        case "2": {
            !callButton.disabled && call();
            break;
        }
        case "3": {
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

if (!hasEnoughAPIs) {
    banner.innerText = 'Your browser does not support WebRTC Encoded Transforms. ' +
        'This sample will not work.';
    if (adapter.browserDetails.browser === 'chrome') {
        banner.innerText += ' Try with Enable experimental Web Platform features enabled from chrome://flags.';
    }
    startButton.disabled = true;
}

function gotStream(stream) {
    console.log('Received local stream');
    video1.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
}

function gotRemoteStream(stream) {
    console.log('Received remote stream');
    remoteStream = stream;
    video2.srcObject = stream;
}

async function start() {
    console.log('Requesting local stream');
    startButton.disabled = true;
    const options = {audio: false, video: true};
    navigator.mediaDevices
        .getUserMedia(options)
        .then(gotStream)
        .catch(function (e) {
            alert('getUserMedia() failed');
            console.log('getUserMedia() error: ', e);
        });

    try {

        let config = {
            type: "webrtc",
            video: {
                contentType: "video/av01.2.15M.10.0.100.09.16.09.0",
                scalabilityMode: "L3T3",
                width: 640,
                height: 480,
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


// We use a Worker to transform `Encoded
// See
//   https://developer.mozilla.org/en-US/docs/Web/API/Worker
// for basic concepts.
const worker = new Worker('./js/worker.js', {name: 'E2EE worker', type: "module"});

// Here we want to decode the encoded video chunk
function setupSenderTransform(sender) {
    if (window.RTCRtpScriptTransform) {
        sender.transform = new RTCRtpScriptTransform(worker, {operation: 'encode'});
        return;
    }

    const senderStreams = sender.createEncodedStreams();
    // Instead of creating the transform stream here, we do a postMessage to the worker. The first
    // argument is an object defined by us, the second is a list of variables that will be transferred to
    // the worker. See
    //   https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
    // If you want to do the operations on the main thread instead, comment out the code below.
    /*
    const transformStream = new TransformStream({
      transform: encodeFunction,
    });
    senderStreams.readable
        .pipeThrough(transformStream)
        .pipeTo(senderStreams.writable);
    */
    const {readable, writable} = senderStreams;
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


