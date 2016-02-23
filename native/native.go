package main

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"io/ioutil"
	"log"
	"os"
	"sync"
	"time"
)

func debug(v ...interface{}) {
	log.Println("kindred | pid:", os.Getpid(), v)
}

type inputJSON struct {
	Type  string   `json:"type"`
	Files []string `json:"files"`
}

type outputJSON struct {
	File string `json:"file"`
	Data string `json:"data"`
}

type outputErrJSON struct {
	File  string `json:"file"`
	Error string `json:"error"`
}

type fileList struct {
	Mutex *sync.Mutex
	Files []*fileInfo
}

func (fl *fileList) Refresh(refresh []string) {
	debug("Refreshing files...", refresh)

	fl.Mutex.Lock()
	for _, ref := range refresh {
		for _, f := range fl.Files {
			if f.File == ref {
				f.ReadModTime = time.Time{}
				f.Error = nil
			}
		}
	}
	fl.Mutex.Unlock()
}

func (fl *fileList) Update(files []string) {
	debug("Updating with...", files)

	fl.Mutex.Lock()
	var newFiles []*fileInfo
	for _, f := range files {
		file := fileInfo{File: f}

		// copy over ReadModTime
		for _, currentFile := range fl.Files {
			if currentFile.File == file.File {
				file.ReadModTime = currentFile.ReadModTime
			}
		}

		newFiles = append(newFiles, &file)
	}

	fl.Files = newFiles
	fl.Mutex.Unlock()
}

func (fl *fileList) ReadAll() {
	fl.Mutex.Lock()
	for _, f := range fl.Files {
		// if a file had an error previously, do not try to read again
		// this is not permanent, as Update() will clear the error
		if f.Error != nil {
			continue
		}

		fdata, err := f.Read()
		if err != nil {
			debug("File:", f.File)
			debug("fileInfo#Read error:", err)

			outerr := outputErrJSON{File: f.File, Error: err.Error()}
			outJSON, err := json.Marshal(outerr)
			if err != nil {
				debug(err)
			}
			output(os.Stdout, outJSON)
			continue
		}

		if fdata == nil {
			continue
		}

		debug("Read:", f.File, "; Got", len(fdata), "bytes")

		out := outputJSON{File: f.File, Data: string(fdata)}
		outj, err := json.Marshal(out)
		if err != nil {
			debug(err)
		}
		output(os.Stdout, outj)
	}
	fl.Mutex.Unlock()
}

type fileInfo struct {
	File        string
	ReadModTime time.Time
	Error       error
}

// wrap _Read() to let all possible errors bubble up
// to easier set fileInfo.Error
func (f *fileInfo) Read() ([]byte, error) {
	data, err := f._Read()
	if err != nil {
		f.Error = err
	}
	return data, err
}

func (f *fileInfo) _Read() ([]byte, error) {
	file, err := os.Open(f.File)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return nil, err
	}

	fmod := fileInfo.ModTime()
	if fmod == f.ReadModTime {
		return nil, nil
	}

	if fileInfo.Size() > 999950 { // 50 bytes off
		return nil, errors.New("File will probably exceed 1MB limit")
	}

	f.ReadModTime = fmod

	data, err := ioutil.ReadAll(file)
	return data, err
}

/**
 * Reads from r, if there is at least 4 bytes to read, reads it. Assumes
 * first 4 bytes is n length of remaining message. Then reads n bytes.
 * Returns only if there is a message, returns n and message.
 * @param  io.Reader r  Reader
 * @return int          message size
 * @return []byte       message
 */
func input(r io.Reader) (int, []byte) {
	// read first 4 bytes
	l := make([]byte, 4)
	rlen, err := r.Read(l)
	if err != nil {
		if err.Error() != "EOF" && rlen != 0 {
			debug("Read data length input error:", err)
			debug("Read", rlen, "bytes")
		}
		return 0, nil
	}

	if rlen == 4 {
		msgSize := binary.LittleEndian.Uint32(l)
		msgBytes := make([]byte, msgSize)
		rlen, err = r.Read(msgBytes)
		if err != nil {
			debug("Reading data from input error:", err)
		}

		if rlen == int(msgSize) {
			return rlen, msgBytes
		}
		debug("Read bytes returned mismatch, expecting:", msgSize, ", but got", rlen)
	}
	return 0, nil
}

/**
 * Writes to msg to w, first 4 bytes is binary of the size of msg.
 * @param  io.Writer w   io.Writer     [description]
 * @param  []byte msg
 */
func output(w io.Writer, msg []byte) {
	err := binary.Write(w, binary.LittleEndian, uint32(len(msg)))
	if err != nil {
		debug("failed to write data length:", err)
		return
	}
	l, err := w.Write(msg)
	if l != len(msg) {
		debug("mismatch writing, wrote:", l, " but expecting:", len(msg))
	}
	if err != nil {
		debug("Write error:", err)
	}
}

/**
 * Continously reads from Stdin for data from chrome extension
 * Incoming messages are JSON { files: []string }
 */
func readStdin(fList *fileList) {
	for {
		_, msg := input(os.Stdin)
		if msg != nil {
			req := inputJSON{}
			err := json.Unmarshal(msg, &req)
			if err != nil {
				debug(err)
			}

			if req.Type == "read" {
				fList.Update(req.Files)
			} else if req.Type == "refresh" {
				fList.Refresh(req.Files)
			}
		}
	}
}

func main() {
	debug("kindred native started.")

	fList := &fileList{Mutex: &sync.Mutex{}}

	go readStdin(fList)

	for {
		fList.ReadAll()
		time.Sleep(300 * time.Millisecond)
	}
}
