package main

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"io/ioutil"
	"log"
	"os"
	"time"
)

type outputJSON struct {
	File string `json:"file"`
	Data []byte `json:"data"`
}

type fileList struct {
	Files []*fileInfo
}

func (fl *fileList) Update(files []string) {
	var newFiles []*fileInfo
	for _, f := range files {
		file := fileInfo{File: f}
		// TODO check if file is already known
		// copy over ReadModTime if so
		// this is to optimize 1 less read per file
		newFiles = append(newFiles, &file)
	}

	fl.Files = newFiles
}

func (fl *fileList) ReadAll() {
	for _, f := range fl.Files {
		// if a file had an error previously, do not try to read again
		// this is not permanent, as Update() will clear the error
		if f.Error != nil {
			continue
		}

		fdata, err := f.Read()
		if err != nil {
			continue
			// TODO should do something with errors, like sending it back to chrome
		}

		out := outputJSON{File: f.File, Data: fdata}
		outj, err := json.Marshal(out)
		if err != nil {
			log.Fatal(err)
		}
		output(os.Stdout, outj)
	}
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

// TODO be able to detect minor file path errors
// e.g. file path might be /path/filename.txt but no file exists
// should then test maybe the path is actually /path/filename/filename.txt
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

	if fileInfo.ModTime() == f.ReadModTime {
		return nil, nil
	}

	if fileInfo.Size() > 999950 { // 50 bytes off
		return nil, errors.New("File will probably exceed 1MB limit")
	}

	f.ReadModTime = fileInfo.ModTime()

	return ioutil.ReadAll(file)
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
		log.Println(err)
	}

	if rlen == 4 {
		msgSize := binary.LittleEndian.Uint32(l)
		msgBytes := make([]byte, msgSize)
		rlen, err = r.Read(msgBytes)
		if err != nil {
			log.Println(err)
		}

		if rlen == int(msgSize) {
			return rlen, msgBytes
		}
		log.Println("Read bytes returned mismatch, expecting:", msgSize, ", but got", rlen)
	}
	return 0, nil
}

/**
 * Writes to msg to w, first 4 bytes is binary of the size of msg.
 * @param  io.Writer w   io.Writer     [description]
 * @param  []byte msg
 */
func output(w io.Writer, msg []byte) {
	binary.Write(w, binary.LittleEndian, uint32(len(msg)))
	w.Write(msg)
}

/**
 * Continously reads from Stdin for data from chrome extension
 * Incoming messages are JSON { files: []string }
 */
func readStdin(fList *fileList) {
	for {
		_, msg := input(os.Stdin)
		if msg != nil {
			var files map[string][]string
			json.Unmarshal(msg, files)
			fList.Update(files["files"])
		}
	}
}

func main() {
	fList := &fileList{}

	go readStdin(fList)

	for {
		fList.ReadAll()
		time.Sleep(50 * time.Millisecond)
	}
}
