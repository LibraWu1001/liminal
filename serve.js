const express = require("express");
const http = require("http");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const server = http.createServer(app);
app.use(express.static(__dirname));
app.use(express.json({ limit: "50mb" }));



const db = new DatabaseSync("chatapp.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT,
    text TEXT,
    type TEXT,
    senderId TEXT,
    createdAt TEXT
  )
`);
try {
  db.exec(`ALTER TABLE messages ADD COLUMN senderId TEXT`);
} catch (error) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    backgroundType TEXT,
    bgColor TEXT,
    bgImage TEXT,
    ownerId TEXT,
    createdAt TEXT
  )
`);

try {
  db.exec(`ALTER TABLE rooms ADD COLUMN ownerId TEXT`);
} catch (error) {}

const insertRoom = db.prepare(`
  INSERT INTO rooms (name, type, backgroundType, bgColor, bgImage, ownerId, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const getRooms = db.prepare(`
  SELECT id, name, type, backgroundType, bgColor, bgImage, ownerId, createdAt
  FROM rooms
  ORDER BY id DESC
`);

const getRoomById = db.prepare(`
  SELECT id, name
  FROM rooms
  WHERE id = ?
`);

const deleteRoom = db.prepare(`
  DELETE FROM rooms
  WHERE id = ?
`);

const deleteRoomMessages = db.prepare(`
  DELETE FROM messages
  WHERE room = ?
`);

const insertMessage = db.prepare(`
  INSERT INTO messages (room, text, type, senderId, createdAt)
  VALUES (?, ?, ?, ?, ?)
`);

const getMessages = db.prepare(`
  SELECT id, room, text, type, senderId, createdAt
  FROM messages
  WHERE room = ?
  ORDER BY id ASC
`);
/* ======================
   Public Image API
====================== */
app.get("/api/rooms", (req, res) => {
  const rooms = getRooms.all();
  res.json(rooms);
});

app.post("/api/rooms", (req, res) => {
  const room = req.body;

  if (!room.name) {
    res.status(400).json({ error: "Room name is required" });
    return;
  }

  insertRoom.run(
  room.name,
  room.type || "",
  room.backgroundType || "color",
  room.bgColor || "",
  room.bgImage || "",
  room.ownerId || "",
  new Date().toISOString()
);

  res.json({ success: true });
});

 app.delete("/api/rooms/:id", (req, res) => {
  const roomId = Number(req.params.id);
  const ownerId = req.query.ownerId || "";
  const room = getRoomById.get(roomId);

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

    

  deleteRoomMessages.run(room.name);
  deleteRoom.run(roomId);

  res.json({ success: true });
});
/* ======================
   Messages API
====================== */
app.get("/api/messages", (req, res) => {
  const room = req.query.room || "Chat";
  const messages = getMessages.all(room);
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  const message = req.body;

  if (!message.room || !message.text) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  insertMessage.run(
    message.room,
    message.text,
    message.type || "text",
    message.senderId || "",
    new Date().toISOString()
  );

  res.json({ success: true });
});

app.get("/api/music", async (req, res) => {
  const query = req.query.query || "happy";

  try {
    const clientId = "17815cac";

    const apiUrl =
      "https://api.jamendo.com/v3.0/tracks/" +
      "?format=json" +
      `&client_id=${clientId}` +
      "&limit=12" +
      "&include=musicinfo" +
      "&audioformat=mp31" +
      `&search=${encodeURIComponent(query)}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    const songs = data.results.map(function(song) {
      return {
        title: song.name,
        artist: song.artist_name,
        url: song.audio
      };
    });

    res.json(songs);
  } catch (error) {
    res.status(500).json({
      error: "Failed to load music"
    });
  }
});
/* ======================
   Public Image API
====================== */
app.get("/api/photos", async (req, res) => {
  const query = req.query.query || "ocean background";

  try {
    const apiUrl =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&format=json" +
      "&generator=search" +
      "&gsrnamespace=6" +
      "&gsrlimit=18" +
      `&gsrsearch=${encodeURIComponent(query)}` +
      "&prop=imageinfo" +
      "&iiprop=url|mime" +
      "&iiurlwidth=400" +
      "&origin=*";

    const response = await fetch(apiUrl);
    const data = await response.json();

    const pages = data.query ? Object.values(data.query.pages) : [];

    const photos = pages
      .map(page => {
        const info = page.imageinfo && page.imageinfo[0];

        if (!info || !info.mime || !info.mime.startsWith("image/")) {
          return null;
        }

        if (info.mime === "image/svg+xml") {
          return null;
        }

        return {
          id: page.pageid,
          title: page.title.replace("File:", ""),
          preview: info.thumburl || info.url,
          full: info.url
        };
      })
      .filter(Boolean);

    res.json(photos);
  } catch (error) {
    res.status(500).json({
      error: "Failed to load photos"
    });
  }
});

/* ======================
   Start server
====================== */
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

/* ======================
   emoji API
====================== */
const EMOJI_API_KEY = "148ea2fc1a477ce6b7c221f98c156bfcb53d4c39";

app.get("/api/emojis", async function(req, res) {
  const search = req.query.search || "";

  const url = search
    ? `https://emoji-api.com/emojis?search=${encodeURIComponent(search)}&access_key=${EMOJI_API_KEY}`
    : `https://emoji-api.com/emojis?access_key=${EMOJI_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Failed to load emojis"
    });
  }
});