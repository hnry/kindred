package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strings"
	"time"
)

var permissions []*permission

type permission struct {
	Client     string    // client name
	Time       time.Time // timestamp of permission request
	Conn       net.Conn
	Permission bool // whether the client has permission
}

type permissionResult struct {
	Client     string
	Permission bool
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

func authorizeClient(client string, access bool) {
	// TODO have to check if this authorization is stale
	// if permission.Time is older than 5mins then reject automatically
	// should communicate this to chrome extension in the original request

	for _, perm := range permissions {
		if perm.Client == client {
			if access {
				perm.Permission = true
				go connHandler(perm.Conn)
			} else {
				perm.Conn.Close()
				// TODO should send a reject response back to client
				// so it doesn't keep trying to reconnect?
				// really depends on how permanent these permissions are
				perm.Permission = false
			}
		}
	}
}

/**
 * Continously reads from conn and relays it to chrome extension
 * Only should be called after authorizeClient()
 * @param	net.Conn	conn	initial connection from client (editor)
 */
func connHandler(conn net.Conn) {
	for {
		msgSize, msg := input(conn)
		if msgSize != 0 {
			output(os.Stdout, msg)
		}
	}
}

/**
 * Connection negotiation for client (editor)
 * Expects first message from client to be it's client name
 * Then sends a request to chrome extension asking if allow/deny this client
 * @param  net.Conn conn
 */
func connNegotiate(conn net.Conn) {
	//conn.SetReadDeadline(time.Now()) TODO
	msgSize, msg := input(conn)
	if msgSize == 0 {
		conn.Close() // TODO send back error msg to client?
	} else {
		// ask chrome extension for permissions for this client
		client := string(msg)
		msg := fmt.Sprintf("{\"permission\": \"%s\"}", strings.TrimSpace(client))
		output(os.Stdout, []byte(msg))
		// TODO check client name unique, otherwise reject
		permissions = append(permissions, &permission{Client: client, Time: time.Now(), Conn: conn})
	}
}

/**
 * Continously reads from Stdin for data from chrome extension
 * The only data ever sent from chrome extension is accept/reject information
 * For clients (editor)
 */
func incomingChrome() {
	for {
		_, incomingMsg := input(os.Stdin)
		if incomingMsg != nil {
			permResult := new(permissionResult)
			json.Unmarshal(incomingMsg, &permResult)
			// if authorization allow/deny
			// else... nothing, editor/client does not take back data
			if permResult.Permission {
				authorizeClient(permResult.Client, permResult.Permission)
			}
		}
	}
}

func main() {
	go incomingChrome()

	server, err := net.Listen("tcp", ":5092")
	if err != nil {
		log.Fatal(err)
	}

	for {
		conn, err := server.Accept()
		if err != nil {
			// handle error TODO
		}
		go connNegotiate(conn)
	}
}
