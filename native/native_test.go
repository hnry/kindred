package main

import (
	"encoding/binary"
	"testing"

	"github.com/stretchr/testify/assert"
)

type MockReader struct {
	buf []byte
}

func (m *MockReader) Read(p []byte) (int, error) {
	l := 0
	pSize := len(p)
	if len(m.buf) >= pSize {
		copy(p, m.buf[0:pSize])
		m.buf = m.buf[pSize:len(m.buf)] // drain the "buffer"
		l = pSize
	}
	return l, nil
}

func Test_input(t *testing.T) {
	r := new(MockReader)

	testStr := "teÅ›tÄ¯ng frÃ¶m the tÃ©st Ã¿ Åª "
	testStrLen := make([]byte, 4)
	binary.LittleEndian.PutUint32(testStrLen, uint32(len(testStr)))
	r.buf = append(testStrLen, []byte(testStr)...,
	)
	rLen, rBytes := input(r)
	rStr := string(rBytes[:rLen])
	assert.Empty(t, 0, len(r.buf), "the mock reader buffer should be drained")
	assert.Equal(t, rLen, len(testStr), "first result should be the size of the test string")
	assert.Equal(t, rStr, testStr, "the test string and the second result should be the same")
}

type MockWriter struct {
	Args [][]byte
}

func (m *MockWriter) Write(p []byte) (int, error) {
	m.Args = append(m.Args, p)
	return len(p), nil
}

func Test_output(t *testing.T) {
	testStr := "teÅ›tÄ¯ng frÃ¶m the tÃ©st"
	lenTestStr := len(testStr)
	w := new(MockWriter)
	output(w, []byte(testStr))
	size := len(w.Args[0])
	assert.Equal(t, 4, size, "first write should be 4 bytes")

	lenWStr := int(binary.LittleEndian.Uint32(w.Args[0]))
	assert.Equal(t, lenTestStr, lenWStr, "first write contains the size of the test string")

	assert.Equal(t, []byte(testStr), w.Args[1], "second write should be the test string")
}
