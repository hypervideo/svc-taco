/*
 *  Copyright (c) 2020 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
//
// A "videopipe" abstraction on top of WebRTC.
//
// The usage of this abstraction:
// var pipe = new VideoPipe(mediastream, handlerFunction);
// handlerFunction = function(MediaStreamTrackEvent) {
//   do_something
// }
// pipe.close();
//
// The VideoPipe will set up 2 PeerConnections, connect them to each
// other, and call HandlerFunction when the stream's track is available
// in the second PeerConnection.
//
'use strict';

function VideoPipe(stream, forceSend, forceReceive, handler, scalabilityMode) {
    this.pc1 = new RTCPeerConnection({
        encodedInsertableStreams: forceSend,
    });
    this.pc2 = new RTCPeerConnection({
        encodedInsertableStreams: forceReceive,
    });
    this.pc2.ontrack = handler;

    stream.getTracks().forEach((track) => {
        if (track.kind !== 'video') {
            this.pc1.addTrack(track, stream);
        } else {
            let tr = this.pc1.addTransceiver(track, {
                streams: [stream],
                sendEncodings: [{ scalabilityMode: scalabilityMode }],
            });

            const videoCodecs = RTCRtpSender.getCapabilities('video').codecs;
            const av1Codecs = videoCodecs.filter((codec) => codec.mimeType === 'video/AV1');

            // Ensure AV1 is the only codec used.
            if (av1Codecs.length > 0) {
                tr.setCodecPreferences(av1Codecs);
                console.log('AV1 codec set as the only preferred codec.', av1Codecs);
            } else {
                console.error('AV1 codec not supported by this browser.');
            }
        }
    });
}

VideoPipe.prototype.negotiate = async function () {
    this.pc1.onicecandidate = (e) => this.pc2.addIceCandidate(e.candidate);
    this.pc2.onicecandidate = (e) => this.pc1.addIceCandidate(e.candidate);

    const offer = await this.pc1.createOffer();
    // Disable video/red to allow for easier inspection in Wireshark.
    await this.pc2.setRemoteDescription({ type: 'offer', sdp: offer.sdp.replace('red/90000', 'green/90000') });
    await this.pc1.setLocalDescription(offer);

    const answer = await this.pc2.createAnswer();
    await this.pc1.setRemoteDescription(answer);
    await this.pc2.setLocalDescription(answer);
};

VideoPipe.prototype.close = function () {
    this.pc1.close();
    this.pc2.close();
};
