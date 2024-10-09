run:
    go run server.go

fmt:
    fd -e go -x gofmt -w
    fd -e js -x prettier -w
