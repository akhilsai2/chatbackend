const express = require("express")
const cors = require("cors")
const http = require("http");
const app = express()
const { Server } = require("socket.io")
app.use(cors({
    origin: "*",
    credentials: true
}))
app.use(express.json())
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "https://6527e16b4e65c804bea4ba83--luxury-syrniki-6547b4.netlify.app",
        methods: ["GET", "POST"],
        credentials: true
    }
}
);
const userConnection = []
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.handshake.auth.username}`);
    socket.join(socket.id)

    userConnection.push({ userId: socket.id, userName: socket.handshake.auth.username })
    console.log(userConnection)
    socket.on("message", ({ content, sender }) => {
        const Receiver = userConnection.filter((x) => x.userName !== sender)[0].userId
        const senderUser = userConnection.filter((x) => x.userName === sender)[0].userId
        socket.to(Receiver).to(Receiver).emit("message", {
            content,
            from: senderUser,
            to: Receiver,
        });
        socket.emit("chatMessage", { content })
    });
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.handshake.auth.username);
    });
    console.log(userConnection)


});
// io.use((socket, next) => {
//     const username = socket.handshake.auth.username;
//     if (!username) {
//         return next(new Error("invalid username"))
//     }
//     socket.username = username;
//     next();
// })

server.listen(8800, () => {
    console.log("Server Connected 8800 ")

})