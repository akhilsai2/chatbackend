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

app.get("/userdata", async function (req, res) {
    async function getuserdata() {
        let result = []
        try {
            await client.connect();
            const database = client.db('AppUsers');
            const userdata = database.collection('loginusers');
            const users = await userdata.find().toArray()
            for await (const item of users) {
                result.push(item)
            }
        } catch (error) {
            console.log(error)
        }
        return result
    }
    const data = await getuserdata();
    res.send(data)

})

app.post("/logout", async function (req, res) {
    async function getlogout() {
        try {
            await client.connect()
            const database = client.db("AppUsers")
            let userdata = database.collection("loginusers")
            await userdata.updateOne({ name: req.body.username }, [{ $set: { "active": false } }])
        } catch (err) {
            console.log(err)
        }
    }
    const result = await getlogout()
    res.json("logout Successfull")

})
app.get("/getmessage", async function (req, res) {
    async function getData() {
        let result = []
        try {
            await client.connect()
            const database = client.db("AppUsers")
            let usermessageData = database.collection("messagestore");
            const users = await usermessageData.find().toArray()
            // console.log(users)
            for await (const item of users) {
                result.push(item)
            }
        } catch (err) {
            console.log(err)
        }
        return result
    }
    const data = await getData();
    res.send(data)
})
app.post('/login', async function (req, res) {
    async function login() {
        let result;
        try {
            await client.connect();
            const database = client.db('AppUsers');
            // const userdata = database.collection('loginusers');
            let userdata = database.collection('loginusers');
            let usermessagedata = database.collection("messagestore")

            if (req.body.name) {
                await userdata.insertOne(req.body)
                await usermessagedata.insertOne({ user: req.body.name, unseen_msg: [], seen_msg: [] })
                res.send("Created Successfully")
            } else {
                await userdata.updateOne({ email: req.body.email }, [{ $set: { "active": true } }])
                await userdata.findOne({ email: req.body.email })
                    .then(users => {
                        if (users) {
                            if (users.password === req.body.password) {
                                const payload = { username: users.name }
                                const jwt = jwtToken.sign(payload, "My Token")
                                // res.json({ jwt: jwt, status: 200, user: users.name })
                                result = { jwt: jwt, status: 200, user: users.name }
                            } else {
                                result = "invalid Crenditials"
                            }

                        } else {
                            result = "no record existed"
                        }
                    })

            }
        } catch (err) {
            console.log(err)

        }
        return result
    }
    const data = await login()
    res.send(data)



});
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "https://652fcafb6676862410e1468e--poetic-flan-6ab540.netlify.app/",
        // origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    connectionStateRecovery: {}
}
);
let userConnection = []
io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.handshake.auth.username}`);
    socket.join(socket.id)
    socket.emit("userID", socket.id)
    userConnection.push({ userId: socket.id, userName: socket.handshake.auth.username })
    // console.log(userConnection)
    socket.on("message", async ({ content, sender, receiver }) => {
        async function getOnlineMessage() {
            try {
                await client.connect();
                const database = client.db('AppUsers');
                let usermessagedata = database.collection('messagestore');
                await usermessagedata.updateOne({ user: receiver }, {
                    $push: {
                        seen_msg: {
                            FromUser: sender, ToUser: receiver, messages: content
                        }
                    }
                })
                const Receiver = userConnection.filter((x) => x.userName === receiver)[0].userId
                const senderUser = userConnection.filter((x) => x.userName === sender)[0].userId
                socket.to(Receiver).to(Receiver).emit("message", {
                    content,
                    from: senderUser,
                    to: Receiver,
                });

                socket.emit("chatMessage", { content, ChatFrom: sender })
            } catch (err) {
                console.log(err)
            }
        }
        const data = await getOnlineMessage()

    });
    // socket.on("chatConnect", ({ receiver,sender }) => {


    // })
    socket.on("backUp", ({ content }) => {
        socket.emit("chatMessage", { content })
    })
    socket.on("offline", async ({ content: message, sender, receiver }, req, res) => {
        async function getOfflineMessage() {
            try {
                await client.connect();
                const database = client.db('AppUsers');
                let usermessagedata = database.collection('messagestore');
                await usermessagedata.updateOne({ user: receiver }, {
                    $push: {
                        unseen_msg: {
                            FromUser: sender, messages: message
                        }
                    }
                })
                socket.emit("chatMessage", { content: message })
            } catch (err) {
                console.log(err)
            }
        }
        const data = await getOfflineMessage()
    })
    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.handshake.auth.username);
        userConnection = []
        // userConnection.filter((x) => x.username !== socket.handshake.auth.username)
    });
    // console.log(userConnection)


});


server.listen(8800, () => {
    console.log("Server Connected 8800 ")

})