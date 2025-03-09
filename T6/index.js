#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');
const express = require("express");


const prisma = new PrismaClient();
const app = express();

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

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Authenticated route
const basicAuth = require('./middleware/basicAuth');
app.get('/hello', basicAuth, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Sample notes data
const data = [
    { title: "Buy groceries", description: "Milk, Bread, Eggs, Butter", completed: false },
    { title: "Walk the dog", description: "Take Bella for a walk in the park", completed: true },
    { title: "Read a book", description: "Finish reading 'The Great Gatsby'", completed: false }
];

// Create a new user
app.post("/users", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Invalid payload" });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    
    if (exists) {
        return res.status(409).json({ message: "A user with that username already exists" });
    }

    const newUser = await prisma.user.create({ data: { username, password } });
    res.status(201).json(newUser);
});

// Create a new note
app.post("/notes", basicAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { title, description, completed, public: isPublic } = req.body;

    if (!title || !description || completed === undefined || isPublic === undefined) {
        return res.status(400).json({ message: "Invalid payload" });
    }

    const newNote = await prisma.note.create({
        data: {
            title,
            description,
            completed,
            public: Boolean(isPublic),
            userId: req.userId,
            author: {   
                connect: { id: req.user.id }  
            }
        }
    });

    res.status(201).json(newNote);
});

// Get notes with optional filtering
app.get("/notes", async (req, res) => {
    const { done } = req.query;
    
    let filter = { public: true };

    if (done !== undefined) {
        if (done !== "true" && done !== "false") {
            return res.status(400).send({ message: "Invalid payload" });
        }
        filter.completed = done === "true";
        
    }

    const notes = await prisma.note.findMany({ where: filter });
    res.status(200).json(notes);
});

// Get a single note by ID
app.get("/notes/:noteId", basicAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const noteId = parseInt(req.params.noteId, 10);
    if (isNaN(noteId) || noteId < 0) {
        return res.status(404).json({ message: "Not found" });
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (note.userId !== req.user.id) {
        return res.status(403).json({ message: "Not permitted" });
    }
    if (!note) {
        return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(note);
});

// Update a note
app.patch("/notes/:noteId", basicAuth, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Invalid payload" });
    }

    const noteId = parseInt(req.params.noteId, 10);
    if (isNaN(noteId) || noteId < 0) {
        return res.status(404).json({ message: "Not found" });
    }

    const { title, description, completed, public: isPublic } = req.body;
    
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (note.userId !== req.user.id) {
        return res.status(403).json({ message: "Not permitted" });
    }
    if (!note) {
        return res.status(404).json({ message: "Not found" });
    }


    const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
            title: title !== undefined ? title : note.title,
            description: description !== undefined ? description : note.description,
            completed: completed !== undefined ? completed : note.completed,
            public: Boolean(isPublic) !== undefined ? Boolean(isPublic): note.public
        }
    });

    res.status(200).json(updatedNote);
});

// ==================

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`Cannot start server: ${err.message}`);
    process.exit(1);
});
