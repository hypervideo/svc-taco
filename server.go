package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	wd, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir(wd))
	http.Handle("/", fs)

	port := "8080"
	log.Printf("Listening on http://localhost:%s/", port)

	// Start the server
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
