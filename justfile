run:
    go run server.go

fmt:
    fd -e go -x gofmt -w
    fd -e js -x prettier -w

parse-key DATA:
    cargo run --bin decode_key "{{ DATA }}"

parse-frame DATA:
    cargo run --bin decode_frame "{{ DATA }}"