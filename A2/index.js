#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();
const cors = require("cors");
const { jwtAuth } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const transRoutes = require("./routes/transactions");
const eventsRoutes = require("./routes/events");
const express = require("express");
const app = express();

app.use(express.json());

// ADD YOUR WORK HERE

app.use("/auth", authRoutes);

app.use("/users",jwtAuth, userRoutes);

app.use("/transactions", jwtAuth, transRoutes);

app.use("/events", jwtAuth, eventsRoutes);


const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});