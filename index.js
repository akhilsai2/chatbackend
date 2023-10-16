const express = require("express")
const cors = require("cors")
const http = require("http");
const jwtToken = require("jsonwebtoken")
const MongoClient = require('mongodb').MongoClient;
const ServerApiVersion = require("mongodb").ServerApiVersion
const app = express()
const dotenv = require("dotenv").config()
const { Server } = require("socket.io")

const client = new MongoClient(process.env.MONGODB_URL,
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

async function run() {
    try {
        await client.connect();
        // const database = client.db('AppUsers');
        // let userdata = database.collection('loginusers');
        console.log("mongo")
    } finally {
        await client.close();
    }
}
run()
app.get("/userdata", async function (req, res) {
    try {
        await client.connect();
        const database = client.db('AppUsers');
        const userdata = database.collection('loginusers');
        // const userdata = database.collection('loginusers');
        const users = await userdata.find().toArray()
        res.send(users)
        // console.log(users)
    } catch (error) {
        console.log(error)
    }
})

app.post("/logout", async function (req, res) {
    try {
        await client.connect()
        const database = client.db("AppUsers")
        let userdata = database.collection("loginusers")
        await userdata.updateOne({ name: req.body.username }, [{ $set: { "active": false } }])
    } catch (err) {
        console.log(err)
    }
})

// app.post()
app.post('/login', async function (req, res) {
    try {
        await client.connect();
        const database = client.db('AppUsers');
        // const userdata = database.collection('loginusers');
        let userdata = database.collection('loginusers');

        if (req.body.name) {
            await userdata.insertOne(req.body)
            res.send("Created Successfully")
        } else {
            await userdata.updateOne({ email: req.body.email }, [{ $set: { "active": true } }])
            await userdata.findOne({ email: req.body.email })
                .then(users => {
                    if (users) {
                        if (users.password === req.body.password) {
                            const payload = { username: users.name }
                            const jwt = jwtToken.sign(payload, "My Token")
                            res.json({ jwt: jwt, status: 200, user: users.name })
                        } else {
                            res.send("Invalid Credentials")
                        }

                    } else {
                        res.json("No Record Existed")
                    }
                })

        }
    } catch (err) {
        console.log(err)

    }

});
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "https://652d300a3b793f0793a97731--glowing-sundae-c74dfd.netlify.app",
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
    socket.on("message", ({ content, sender, receiver }) => {
        const Receiver = userConnection.filter((x) => x.userName === receiver)[0].userId
        const senderUser = userConnection.filter((x) => x.userName === sender)[0].userId
        socket.to(Receiver).to(Receiver).emit("message", {
            content,
            from: senderUser,
            to: Receiver,
            ChatTo: receiver
        });
        socket.emit("chatMessage", { content, ChatFrom: sender })
    });
    // socket.on("chatConnect", ({ receiver,sender }) => {


    // })
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.handshake.auth.username);
        // userConnection = []
        userConnection.filter((x) => x.username !== socket.handshake.auth.username)
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