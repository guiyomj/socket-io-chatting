const express = require('express')
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const corsOption = {
    origin: "*",
    methods:["GET","POST"]
 }

const app = express()
app.use(cors(corsOption))

const domain = 'chat.dongjakin.com'
const opt = {
    ca: fs.readFileSync('/etc/letsencrypt/live/' + domain+ '/fullchain.pem'),
    key: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain+ '/privkey.pem'), 'utf8').toString(),
    cert: fs.readFileSync(path.resolve(process.cwd(), '/etc/letsencrypt/live/' + domain+ '/cert.pem'), 'utf8').toString()
}
const server = https.Server(opt, app)
const socketio = require('socket.io')
const io = socketio(server, {
    cors: corsOption,
    secure: true
})

let onUser = []
let onTypingUser = []
let chatList = []

http.Server(app).listen(80)
server.listen(443)
app.get('*', (req, res, next) => {
    res.json('')
    if (req.secure) next
    else {
        let to = 'https://' + req.headers.host + req.url
        return res.redirect(to)
    }
})


app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
})

io.on('connection', (socket) => {
    socket.on('enter', (uid) => {
        onUser.push(uid)
        onUser = [...new Set(onUser)]
        io.emit('onUser', onUser)
        io.emit('onTypingUser', onTypingUser)
    })
  
    socket.on('message', (data) => {
        console.log('msg',data)
        chatList.push(data)
        io.emit('chatList', chatList)
    })
  
    socket.on('typing', (uid) => {
        onTypingUser.push(uid)
        onTypingUser = [...new Set(onTypingUser)]
        io.emit('onTypingUser', onTypingUser)
    })
  
    socket.on('notyping', (uid) => {
        onTypingUser.indexOf(uid) != -1 && onTypingUser.splice(onTypingUser.indexOf(uid), 1)
        io.emit('onTypingUser', onTypingUser)
    })
  
    socket.on('leave', (uid) => {
        onUser.indexOf(uid) != -1 && onUser.splice(onUser.indexOf(uid), 1)
        onTypingUser.indexOf(uid) != -1 && onTypingUser.splice(onTypingUser.indexOf(uid), 1)
        io.emit('onUser', onUser)
    })
  })
