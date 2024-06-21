/****************** ADDED FOR HTTPS RUN ********************************************* */
const express = require('express')
const app = express()
const https = require('https')
const fs = require('fs')
const port = 3000

app.get('/', (req, res) => {
    // res.send("IT'S WORKING!")
    res.sendFile(__dirname + '/public/index.html')
})
const httpsOptions = {
    key: fs.readFileSync('./security/cert.key'),
    cert: fs.readFileSync('./security/cert.pem')
}
const server = https.createServer(httpsOptions, app)
    .listen(port, () => {
        console.log('server running at ' + port)
    })
/*************************************************************** */



// const express = require('express');
// const http = require('http');
const PORT = process.env.PORT || 3000;
// const app = express();
// const server = http.createServer(app);
const io = require('socket.io')(server);



app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

let connectedPeers = [];
let connectedPeersStrangers = [];

io.on('connection', (socket) => {
    connectedPeers.push(socket.id);

    socket.on('pre-offer', (data) => {
        // M4hastam

        const { calleePersonalCode, callType } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === calleePersonalCode);

        if (connectedPeer) {
            const data = {
                callerSocketId: socket.id,
                callType
            };
            io.to(calleePersonalCode).emit('pre-offer', data);
        } else {
            const data = {
                preOfferAnswer: 'CALLEE_NOT_FOUND'
            }
            io.to(socket.id).emit('pre-offer-answer', data);
        }
    })

    socket.on('pre-offer-answer', (data) => {


        const { callerSocketId } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === callerSocketId);

        if (connectedPeer) {

            io.to(callerSocketId).emit('pre-offer-answer', data);
        }



    });

    socket.on('webRTC-signaling', (data) => {

        const { connectedUserSocketId } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === connectedUserSocketId);

        if (connectedPeer) {

            io.to(connectedUserSocketId).emit('webRTC-signaling', data);
        }
    });

    socket.on('user-hanged-up', (data) => {
        const { connectedUserSocketId } = data;

        const connectedPeer = connectedPeers.find((peerSocketId) => peerSocketId === connectedUserSocketId);

        if (connectedPeer) {

            io.to(connectedUserSocketId).emit('user-hanged-up');
        }
    });

    socket.on('stranger-connections-status', (data) => {
        const { status } = data;

        if (status) {
            connectedPeersStrangers.push(socket.id);
        } else {
            const newConnectedPeersStranger = connectedPeersStrangers.filter((peerSocketId => peerSocketId !== socket.id));

            connectedPeersStrangers = newConnectedPeersStranger;
        }

        console.log(connectedPeersStrangers);
    });

    socket.on('get-stranger-socket-id', () => {

        let randomStrangerSocketId;

        const filteredConnectedPeersStrangers = connectedPeersStrangers.filter(
            (peerSocketId) => peerSocketId !== socket.id
        );

        if (filteredConnectedPeersStrangers.length > 0) {
            randomStrangerSocketId =
                filteredConnectedPeersStrangers[
                Math.floor(Math.random() * filteredConnectedPeersStrangers.length)
                ];
        } else {
            randomStrangerSocketId = null;
        }

        const data = {
            randomStrangerSocketId
        }

        io.to(socket.id).emit('stranger-socket-id', data);


    });

    socket.on('disconnect', () => {

        const newConnectedPeers = connectedPeers.filter((socketPeer) => {
            return socketPeer !== socket.id
        });

        connectedPeers = newConnectedPeers;

        const newConnectedPeersStranger = connectedPeersStrangers.filter((peerSocketId => peerSocketId !== socket.id));

        connectedPeersStrangers = newConnectedPeersStranger;



    });



});

// server.listen(PORT, () => {
//     console.log('server is running ..');
// })