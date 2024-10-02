# svc-taco

This repository aims to extract video frame data encoded using SVC. It builds on top of the
WebRTC [endtoend-encryption](https://github.com/webrtc/samples/tree/b938fa9552d21b8edb189d4922ddaaa9bb22128b/src/content/insertable-streams/endtoend-encryption)
sample.

## Status

Currently, the demo can log spatial and temporal layers for every encoded video frame. Codecs currently tested are VP9
and AV1.

![Screenshot 2024-09-19 at 5.11.05 PM.png](..%2F..%2F..%2F..%2Fvar%2Ffolders%2Fcf%2F2zn3fff571q4r9ryk84qlsjc0000gn%2FT%2FTemporaryItems%2FNSIRD_screencaptureui_bS0W0Y%2FScreenshot%202024-09-19%20at%205.11.05%E2%80%AFPM.png)

## How to Run

```sh
# this assumes you have Golang and Just installed
# inside project root directory
just run # or go run server.go

> [!NOTE]  
> When running the demo, make sure to disable cache!

```

## Resources:

[Janus AV1-SVC support PR](https://github.com/meetecho/janus-gateway/pull/2741/files)

[Article attached](https://www.meetecho.com/blog/vp9-av1-simulcast-svc/)

