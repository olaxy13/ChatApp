import express from "express"
import { Server } from "socket.io";
import path from "path";

//fixing __dirname variable for ES6
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);


const PORT = process.env.PORT || 3500
const app = express()
app.use(express.static(path.join(__dirname, "public")))
const expressServer = app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`)
})
const io = new Server(expressServer, { 
    //cors =cross origin resouce request sharing
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"] 
    }
})


io.on("connection", (socket)=> { 
    console.log(`User ${socket.id} connected`)

    //Upon connection this message goes to only the user tha just connected!
    socket.emit("message", "Welcome to the Chat app!")

        //socket.broadcast goes to everyone except te user
    //Upon connection - This message goes to all users that on the chat except the user that just connect 
    socket.broadcast.emit("message", `User ${socket.id.substring(0,5)} connected`)

    //Listen for new messages event from user and broadcast it to everyone else
    //substring(0,5) is to limit the username to 5 characters for demonstration purposes.
    socket.on("message", (data) => {
        console.log(data)
        //io.emmit == goes to everyone connected to the server
        io.emit("message", `${socket.id.substring(0, 5)}: ${data}`)
    })

    //when user disconnect
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`)
        //send a message to all users that a user just disconnected
        socket.broadcast.emit("message", `User ${socket.id.substring(0,5)} disconnected`)
    })

    //listen for activity
    socket.on("activity", (name) => {
        console.log(name)
        socket.broadcast.emit("activity", name)
        //io.emmit == goes to everyone connected to the server
        //io.emit("activity", `${socket.id.substring(0,5)} is active`)
    })
})

