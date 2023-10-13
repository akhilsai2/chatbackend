const express = require("express")
const cors = require("cors")
const http = require("http");
const jwtToken = require("jsonwebtoken")
const MongoClient = require('mongodb').MongoClient;
const ServerApiVersion = require("mongodb").ServerApiVersion
const app = express()
const { Server } = require("socket.io")

const client = new MongoClient('mongodb+srv://saiakil456:saiakhil564@cluster0.6ng9cuv.mongodb.net/?retryWrites=true&w=majority',
    {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

app.use(cors({
    origin: "*",
    credentials: true
}))
app.use(express.json())
app.get("/userdata", async function (req, res) {
    try {
        await client.connect();
        const database = client.db('AppUsers');
        const userdata = database.collection('loginusers');
        const users = await userdata.find().toArray()
        res.send(users)
        // console.log(users)
    } finally {
        await client.close();
    }
})
app.post('/login', async function (req, res) {
    try {
        await client.connect();
        const database = client.db('AppUsers');
        const userdata = database.collection('loginusers');
        if (req.body.name) {
            await userdata.insertOne(req.body)
            res.send("Created Successfully")
        } else {
            await userdata.findOne({ email: req.body.email })
                .then(users => {
                    // console.log(users)
                    // console.log(req.body.password)
                    if (users) {
                        if (users.password === req.body.password) {

                            res.send("Success")
                        } else {
                            res.send("Invalid Credentials")
                        }

                    } else {
                        res.json("No Record Existed")
                    }
                })

        }
    } finally {
        await client.close();
    }

});
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "https://6527e16b4e65c804bea4ba83--luxury-syrniki-6547b4.netlify.app",
        // origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
}
);
let userConnection = []
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.handshake.auth.username}`);
    socket.join(socket.id)
    socket.emit("userID", socket.id)

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
        userConnection = []
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