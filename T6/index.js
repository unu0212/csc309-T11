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
const express = require("express");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// ADD YOUR WORK HERE

const data = [
    {
      title: "Buy groceries",
      description: "Milk, Bread, Eggs, Butter",
      completed: false
    },
    {
      title: "Walk the dog",
      description: "Take Bella for a walk in the park",
      completed: true
    },
    {
      title: "Read a book",
      description: "Finish reading 'The Great Gatsby'",
      completed: false
    }
  ]
  app.get("/notes", async (req, res) => {
    
    const { done } = req.query;
    //let filter = {public : true};
    if (done !== undefined ) {
        if(done !== "true" && done !== "false"){
            return res.status(400).send({message: "Invalid payload"});
        }
        //filter.completed = done === 'true';
        if(done === 'true'){
            const complete_notes = await prisma.note.findMany({where: {completed: true, public: true}});
            return res.json(complete_notes);
        }
        if(done === 'false'){
            const incomplete_notes = await prisma.note.findMany({where: {completed: false, public: true}});
            return res.json(incomplete_notes);
        }
    }
    const notes = await prisma.note.findMany({where: {public: true}});
    res.status(200).json(notes);
    
    
});
app.get("/notes/:noteId", async (req, res) => {
    if(!req.user){
        return res.status(401).json({message: "Not authenticated"});
    }
    const {noteId} = req.params;
    
    const note = await prisma.note.findUnique({where: {id: noteId}});
    if (noteId < 0 || !note || isNaN(noteId)) {
        return res.status(404).json({message: "Not found"});
    }
    if(note.userId !== req.user.id){
        return res.status(403).json({message: "Not permitted"});
    }
    res.status(200).json(note);
});
app.post("/users", async (req, res) => {
    const {username, password} = req.body;
    const exists = await prisma.user.findUnique({where: {username: username}})
    if(!username || !password){
        return res.status(400).json({message: "Invalid payload"});
    }
    if(exists){
        return res.status(409).json({message: "A user with that username already exists"});
    }
    const newUser = await prisma.user.create({data: {username, password}});
    res.status(201).json(newUser);

});
app.post("/notes", async (req, res) => {
    if (!req.user){
        return res.status(401).json({message: "Not authenticated"});
    }
    const { title, description, completed, public} = req.body;
    if(!title || !description || completed === undefined || public === undefined){
        return res.status(400).json({message: "Invalid payload"});
    }
    const newNote = await prisma.note.create({data: {title, description, completed, public, userId: req.userId}})
    res.status(200).json(newNote);
});
app.patch("/notes/:noteId", async (req, res) => {
    if(!req.user){
        return res.status(401).json({message: "Not authenticated"});
    }
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Invalid payload" });
    }
    const noteId = req.params;
    const {title, description, completed, public} = req.body;
    const note = await prisma.note.findUnique({where: {id: noteId}});
    if(!note){
        return res.status(404).json({message: "Not found"});
    }
    if (note.userId !== req.user.id){
        return res.status(403).json({message: "Not permitted"});
    }

    const updatedNote = await prisma.note.update({
        where: {id: noteId},
        data: {
            title: title !== undefined ? title: note.title,
            description: description !== undefined ? description : note.description,
            completed: completed !== undefined ? completed: note.completed,
            public: public !== undefined ? public : note.public
        }
    })
    res.status(200).json(updatedNote);
});
// ==================

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});


const basicAuth = require('./middleware/basicAuth');

app.get('/hello', basicAuth, (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});