import express from "express"
import { Server } from "socket.io";
import path from "path";
const app = express()


// const app = require('express')();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);
// io.on('connection', () => { /* … */ });
// server.listen(3000);

//fixing __dirname variable for ES6
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);


const PORT = process.env.PORT || 3500
const ADMIN = "Admin"


app.use(express.static(path.join(__dirname, "public")))
const expressServer = app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`)
})

//state
const UsersState = {
    users: [],
        setUsers: function (newUsersArray) {
            this.users = newUsersArray
        }
}

const io = new Server(expressServer, { 
    //cors =cross origin resouce request sharing
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"] 
    }
})


io.on("connection", (socket)=> {
    console.log(`User ${socket.id} connected`)

        //socket.broadcast goes to everyone except te user
    //Upon connection - This message goes to all users that on the chat except the user that just connect 
    socket.emit("message", buildMsg(ADMIN, "Welcome to chat App!"))

    socket.on("enterRoom", ({name, room}) => {
        //leave previous Room
        const prevRoom = getUser(socket.id)?.room
        if(prevRoom) {
            socket.leave(prevRoom)
            io.to(prevRoom).emit("message", buildMsg(ADMIN, `${name} has left the room`))
        }
        const user = activateUser(socket.id, name, room)

        //cannot update previous room users list until after the state update in activate user
        if(prevRoom ) {
            io.to(prevRoom).emit("userList", {
                users: getUsersInRoom(prevRoom)
            })
        }

        //join room
        socket.join(user.room)

        //To user who joined
        socket.emit("message", buildMsg(ADMIN, `You have joined the ${user.room} chat room`))
    
        //To evryone else
        socket.broadcast.to(user.room).emit("message", buildMsg(ADMIN, `${name} has joined the room`))

        //send user list to the new user
        io.to(user.room).emit("userList", {
            users: getUsersInRoom(user.room)
        })

        //Update rooms list for everyone
        io.emit("roomList",{
            rooms: getAllActiveRoom()
        })
    })

        //when user disconnect
    socket.on("disconnect", () => {
        const user = getUser(socket.id)
        userLeavesApp(socket.id)
        console.log(`User ${socket.id} disconnected`)
        if(user) {
            io.to(user.room).emit("message", buildMsg(ADMIN,`${user.name} has left the group`))

            io.to(user.room).emit("userList", {
                users: getUsersInRoom(user.room)
            })

            //Update rooms list for everyone
            io.emit("roomList",{
            rooms: getAllActiveRoom()
        })      
        }

        console.log(`User ${socket.id} disconnected`)
    })


    //Listen for new messages event from user and broadcast it to everyone else
    //substring(0,5) is to limit the username to 5 characters for demonstration purposes.
    socket.on("message", ({name, text}) => {
        const room = getUser(socket.id)?.room
        if(room) {
            //io.emmit == goes to everyone connected to the server
            io.to(room).emit("message", buildMsg(name, text))
        }
        
        
    })

    //listen for activity
    socket.on("activity", (name) => {
     const room = getUser(socket.id)?.room
        if(room){
            socket.broadcast.to(room).emit("activity", name)
        }
        //io.emmit == goes to everyone connected to the server
        //io.emit("activity", `${socket.id.substring(0,5)} is active`)
    })
})

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        }).format(new Date())
    }
}

//USer function
function activateUser(id, name, room) {
    const user = { id, name, room}
    UsersState.setUsers([
        ...UsersState.users.filter(user=> user.id !==id),
        user 
    ])
    return user
}

function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user=> user.id !== id)
    )
}

function getUser(id) {
    return UsersState.users.find(user=> user.id === id)
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user=> user.room === room)
}

function getAllActiveRoom() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
    //return [...new Set(UsersState.users.map(user=> user.room))]
}



// import 'package:flutter/material.dart';
// import 'package:socket_io_client/socket_io_client.dart' as IO;

// void main() {
//   runApp(ChatApp());
// }

// class ChatApp extends StatelessWidget {
//   @override
//   Widget build(BuildContext context) {
//     return MaterialApp(
//       title: 'Chat App',
//       home: ChatScreen(),
//     );
//   }
// }

// class ChatScreen extends StatefulWidget {
//   @override
//   _ChatScreenState createState() => _ChatScreenState();
// }

// class _ChatScreenState extends State<ChatScreen> {
//   final TextEditingController _nameController = TextEditingController();
//   final TextEditingController _roomController = TextEditingController();
//   final TextEditingController _messageController = TextEditingController();
//   IO.Socket? socket;
//   List<String> messages = [];
//   String? userName;
//   String? roomName;

//   @override
//   void initState() {
//     super.initState();
//     initSocket();
//   }

//   void initSocket() {
//     socket = IO.io('http://your-server-url', <String, dynamic>{
//       'transports': ['websocket'],
//       'autoConnect': false,
//     });

//     socket!.onConnect((_) {
//       print('Connected');
//     });

//     socket!.on('message', (data) {
//       setState(() {
//         messages.add(data);
//       });
//     });

//     socket!.onDisconnect((_) => print('Disconnected'));
//     socket!.connect();
//   }

//   void joinRoom() {
//     if (_nameController.text.isNotEmpty && _roomController.text.isNotEmpty) {
//       userName = _nameController.text;
//       roomName = _roomController.text;
//       socket!.emit('join', {'name': userName, 'room': roomName});
//     }
//   }

//   void sendMessage() {
//     if (_messageController.text.isNotEmpty) {
//       socket!.emit('message', _messageController.text);
//       _messageController.clear();
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(title: Text('Chat Room')),
//       body: Column(
//         children: [
//           Padding(
//             padding: const EdgeInsets.all(8.0),
//             child: Row(
//               children: [
//                 Expanded(
//                   child: TextField(
//                     controller: _nameController,
//                     decoration: InputDecoration(labelText: 'Your Name'),
//                   ),
//                 ),
//                 Expanded(
//                   child: TextField(
//                     controller: _roomController,
//                     decoration: InputDecoration(labelText: 'Chat Room'),
//                   ),
//                 ),
//                 ElevatedButton(
//                   onPressed: joinRoom,
//                   child: Text('Join'),
//                 ),
//               ],
//             ),
//           ),
//           Expanded(
//             child: ListView.builder(
//               itemCount: messages.length,
//               itemBuilder: (context, index) {
//                 return ListTile(title: Text(messages[index]));
//               },
//             ),
//           ),
//           Padding(
//             padding: const EdgeInsets.all(8.0),
//             child: Row(
//               children: [
//                 Expanded(
//                   child: TextField(
//                     controller: _messageController,
//                     decoration: InputDecoration(labelText: 'Your Message'),
//                   ),
//                 ),
//                 ElevatedButton(
//                   onPressed: sendMessage,
//                   child: Text('Send'),
//                 ),
//               ],
//             ),
//           ),
//         ],
//       ),
//     );
//   }

//   @override
//   void dispose() {
//     socket!.dispose();
//     _nameController.dispose();
//     _roomController.dispose();
//     _messageController.dispose();
//     super.dispose();
//   }
// }
