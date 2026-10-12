function goHome() {
  window.location.href = "rooms.html";
}
function goToRoomSelection() {
  window.location.href = "rooms.html";
}

function goToCreateRoom() {
  window.location.href = "create-room.html";
}

function togglePlusMenu() {
  const menu = document.getElementById("plusMenu");
  if (!menu) return;

  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function enterRoom(roomName, bgColor) {
  localStorage.setItem("roomName", roomName);
  localStorage.setItem("backgroundType", "color");
  localStorage.setItem("bgColor", bgColor);

  window.location.href = "chat-room.html";
}

async function randomRoom() {
  const response = await fetch("/api/rooms");
  const rooms = await response.json();

  if (rooms.length === 0) {
    alert("No rooms yet. Please create a room first.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * rooms.length);
  const room = rooms[randomIndex];

  openCreatedRoom(room);
}

async function saveCreatedRoom(room) {
  await fetch("/api/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(room)
  });
}

function openCreatedRoom(room) {
  localStorage.setItem("roomName", room.name);
  localStorage.setItem("roomType", room.type);
  localStorage.setItem("backgroundType", room.backgroundType);

  if (room.backgroundType === "color") {
    localStorage.setItem("bgColor", room.bgColor);
  } else {
    localStorage.setItem("bgImage", room.bgImage);
  }

  window.location.href = "chat-room.html";
}

async function deleteCreatedRoom(room, card) {
  const confirmDelete = confirm("Delete this room?");
  if (!confirmDelete) return;

  const response = await fetch(`/api/rooms/${room.id}?ownerId=${encodeURIComponent(myUserId)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    alert("You can only delete rooms you created.");
    return;
  }

  card.remove();
}

async function loadCreatedRooms() {
  const roomGrid = document.getElementById("roomGrid");
  if (!roomGrid) return;

  roomGrid.innerHTML = "";

  const response = await fetch("/api/rooms");
  const rooms = await response.json();

  rooms.forEach(function(room) {
    const card = document.createElement("div");
    card.className = "room-card";

    if (room.backgroundType === "color") {
      card.style.background = `linear-gradient(135deg, ${room.bgColor}, #ffffff)`;
    } else {
      card.style.backgroundImage = `url(${room.bgImage})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }

    card.onclick = function() {
      openCreatedRoom(room);
    };

const info = document.createElement("div");
info.className = "room-card-info";

const name = document.createElement("span");
name.className = "room-card-name";
name.textContent = room.name;

const type = document.createElement("span");
type.className = "room-card-type";
type.textContent = room.type;

info.appendChild(name);
info.appendChild(type);

if (room.ownerId === myUserId) {
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-room-btn";
  deleteButton.textContent = "×";

  deleteButton.onclick = function(event) {
    event.stopPropagation();
    deleteCreatedRoom(room, card);
  };

  card.appendChild(deleteButton);
}

card.appendChild(info);
roomGrid.appendChild(card);
  });
}

function showBackgroundOption() {
  const backgroundType = document.getElementById("backgroundType");
  const colorOption = document.getElementById("colorOption");
  const imageOption = document.getElementById("imageOption");
  const onlineOption = document.getElementById("onlineOption");

  if (!backgroundType || !colorOption || !imageOption || !onlineOption) return;

  colorOption.style.display = backgroundType.value === "color" ? "block" : "none";
  imageOption.style.display = backgroundType.value === "image" ? "block" : "none";
  onlineOption.style.display = backgroundType.value === "online" ? "block" : "none";

  if (backgroundType.value === "online") {
    loadOnlinePhotos();
  }
}

async function createRoom() {
  const roomName = document.getElementById("roomName").value.trim();
  const roomType = document.getElementById("roomType").value;
  const backgroundType = document.getElementById("backgroundType").value;

  if (roomName === "") {
    alert("Please enter a room name.");
    return;
  }

  localStorage.setItem("roomName", roomName);
  localStorage.setItem("roomType", roomType);
  localStorage.setItem("backgroundType", backgroundType);

  if (backgroundType === "color") {
    const bgColor = document.getElementById("bgColor").value;
    localStorage.setItem("bgColor", bgColor);

    await saveCreatedRoom({
      name: roomName,
      type: roomType,
      backgroundType: "color",
      bgColor: bgColor,
      bgImage: "",
      ownerId: myUserId
    });

    window.location.href = "chat-room.html";
    return;
  }

  if (backgroundType === "online") {
    if (!selectedOnlineImage) {
      alert("Please choose an online background.");
      return;
    }

    localStorage.setItem("bgImage", selectedOnlineImage);

    await saveCreatedRoom({
      name: roomName,
      type: roomType,
      backgroundType: "online",
      bgColor: "",
      bgImage: selectedOnlineImage,
      ownerId: myUserId
    });

    window.location.href = "chat-room.html";
    return;
  }

  const imageFile = document.getElementById("bgImage").files[0];

  if (!imageFile) {
    alert("Please upload a background image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function(event) {
    const imageData = event.target.result;
    localStorage.setItem("bgImage", imageData);

    await saveCreatedRoom({
      name: roomName,
      type: roomType,
      backgroundType: "image",
      bgColor: "",
      bgImage: imageData,
      ownerId: myUserId
    });

    window.location.href = "chat-room.html";
  };

  reader.readAsDataURL(imageFile);
}

function updateColorPreview() {
  const bgColor = document.getElementById("bgColor");
  const colorText = document.getElementById("colorText");

  if (bgColor && colorText) {
    colorText.textContent = bgColor.value;
    colorText.style.backgroundColor = bgColor.value;
  }
}

function updateFileName() {
  const bgImage = document.getElementById("bgImage");
  const fileName = document.getElementById("fileName");

  if (!bgImage || !fileName) return;

  if (bgImage.files.length > 0) {
    fileName.textContent = bgImage.files[0].name;
  } else {
    fileName.textContent = "Choose background photo";
  }
}

function initPrettySelects() {
  const selects = document.querySelectorAll(".custom-select-wrap");

  selects.forEach(function(selectBox) {
    const realSelect = selectBox.querySelector("select");
    const triggerBox = selectBox.querySelector(".custom-select-trigger");
    const triggerText = selectBox.querySelector(".custom-select-trigger span");
    const options = selectBox.querySelectorAll(".custom-select-option");

    if (!realSelect || !triggerBox || !triggerText) return;

    triggerBox.addEventListener("click", function(event) {
      event.stopPropagation();

      selects.forEach(function(otherBox) {
        if (otherBox !== selectBox) {
          otherBox.classList.remove("open");
        }
      });

      selectBox.classList.toggle("open");
    });

    options.forEach(function(option) {
      option.addEventListener("click", function(event) {
        event.stopPropagation();

        realSelect.value = option.dataset.value;
        triggerText.textContent = option.textContent;

        options.forEach(function(item) {
          item.classList.remove("selected");
        });

        option.classList.add("selected");
        selectBox.classList.remove("open");

        if (realSelect.id === "backgroundType") {
          showBackgroundOption();
        }
      });
    });
  });

  document.addEventListener("click", function() {
    selects.forEach(function(selectBox) {
      selectBox.classList.remove("open");
    });
  });
}

/* =====================
   AVATAR + USER ID
===================== */

function generateAvatarFromId(id) {
  const shapes = [
    "circle",
    "square",
    "rounded-square",
    "diamond",
    "triangle",
    "pentagon",
    "hexagon",
    "star"
  ];

  const colors = [
    "#ff6b6b",
    "#6bc5ff",
    "#7bed9f",
    "#f7d794",
    "#a29bfe",
    "#fd79a8",
    "#55efc4",
    "#ffeaa7"
  ];

  let total = 0;

  for (let i = 0; i < id.length; i++) {
    total += id.charCodeAt(i);
  }

  return {
    shape: shapes[total % shapes.length],
    color: colors[total % colors.length]
  };
}

let myUserId = localStorage.getItem("myUserId");

if (!myUserId) {
  myUserId = Date.now().toString() + Math.random().toString();
  localStorage.setItem("myUserId", myUserId);
}

let selectedEmoji = "";
let renderedMessageIds = new Set();
let selectedOnlineImage = "";

function applyAvatarShape(el, shape) {
  el.style.width = "34px";
  el.style.height = "34px";
  el.style.background = el.dataset.color;
  el.style.borderRadius = "0";
  el.style.borderLeft = "";
  el.style.borderRight = "";
  el.style.borderBottom = "";
  el.style.clipPath = "";
  el.style.transform = "";

  if (shape === "circle") el.style.borderRadius = "50%";
  if (shape === "rounded-square") el.style.borderRadius = "10px";
  if (shape === "diamond") el.style.transform = "rotate(45deg)";

  if (shape === "triangle") {
    el.style.width = "0";
    el.style.height = "0";
    el.style.background = "transparent";
    el.style.borderLeft = "17px solid transparent";
    el.style.borderRight = "17px solid transparent";
    el.style.borderBottom = `34px solid ${el.dataset.color}`;
  }

  if (shape === "pentagon") {
    el.style.clipPath =
      "polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)";
  }

  if (shape === "hexagon") {
    el.style.clipPath =
      "polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)";
  }

  if (shape === "star") {
    el.style.clipPath =
      "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";
  }
}

function makeAvatar(senderId) {
  const avatarData = generateAvatarFromId(senderId || "unknown");
  const avatar = document.createElement("div");

  avatar.className = "avatar";
  avatar.dataset.color = avatarData.color;

  applyAvatarShape(avatar, avatarData.shape);

  return avatar;
}

/* =====================
   CHAT RENDER
===================== */

function addMessageShell(bubble, side, senderId) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const wrapper = document.createElement("div");
  wrapper.className = "message " + side;

  const avatar = makeAvatar(senderId);

  if (side === "me") {
    wrapper.appendChild(bubble);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  }

  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addTextMessageToChat(text, side, senderId) {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  addMessageShell(bubble, side, senderId);
}

function addImageMessageToChat(imageUrl, side, senderId) {
  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const img = document.createElement("img");
  img.src = imageUrl;

  bubble.appendChild(img);
  addMessageShell(bubble, side, senderId);
}

function addMusicMessageToChat(title, url, side, senderId) {
  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const name = document.createElement("div");
  name.textContent = title;

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.src = url;

  bubble.appendChild(name);
  bubble.appendChild(audio);

  addMessageShell(bubble, side, senderId);
}

/* =====================
   CHAT API
===================== */

async function sendMessage() {
  const input = document.getElementById("messageInput");
  if (!input) return;

  const text = input.value.trim();
  const finalText = text + (selectedEmoji ? " " + selectedEmoji : "");

  if (!finalText.trim()) return;

  const roomName = localStorage.getItem("roomName") || "Chat";

  await fetch("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      room: roomName,
      text: finalText,
      type: "text",
      senderId: myUserId
    })
  });

  input.value = "";
  selectedEmoji = "";

  loadMessages();
}

async function loadMessages() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  const roomName = localStorage.getItem("roomName") || "Chat";

  const response = await fetch(
    `/api/messages?room=${encodeURIComponent(roomName)}`
  );

  const messages = await response.json();

  messages.forEach(function(message) {
    if (renderedMessageIds.has(message.id)) return;

    const side = message.senderId === myUserId ? "me" : "other";

    if (message.type === "image") {
      addImageMessageToChat(message.text, side, message.senderId);
    } else if (message.type === "music") {
      const music = JSON.parse(message.text);
      addMusicMessageToChat(music.title, music.url, side, message.senderId);
    } else {
      addTextMessageToChat(message.text, side, message.senderId);
    }

    renderedMessageIds.add(message.id);
  });
}

function startChatPolling() {
  if (!document.getElementById("chatBox")) return;

  loadMessages();
  setInterval(loadMessages, 1000);
}

/* =====================
   IMAGE + MUSIC SEND
===================== */

function sendImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function(e) {
    const roomName = localStorage.getItem("roomName") || "Chat";

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room: roomName,
        text: e.target.result,
        type: "image",
        senderId: myUserId
      })
    });

    event.target.value = "";
    loadMessages();
  };

  reader.readAsDataURL(file);
}

function sendMusic(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function(e) {
    const roomName = localStorage.getItem("roomName") || "Chat";

    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        room: roomName,
        text: JSON.stringify({
          title: file.name,
          url: e.target.result
        }),
        type: "music",
        senderId: myUserId
      })
    });

    event.target.value = "";
    loadMessages();
  };

  reader.readAsDataURL(file);
}

/* =====================
   EMOJI + MENU
===================== */

function toggleEmojiPanel() {
  const panel = document.getElementById("emojiPanel");
  if (!panel) return;

  panel.classList.toggle("show");

  if (panel.classList.contains("show")) {
    loadDefaultEmojis();
  }
}

function addEmoji(emoji) {
  const input = document.getElementById("messageInput");
  if (!input) return;

  input.value += emoji;
  input.focus();
}

function renderEmojiResults(emojis) {
  const results = document.getElementById("emojiResults");
  if (!results) return;

  results.innerHTML = "";

  emojis.slice(0, 36).forEach(function(emoji) {
    const span = document.createElement("span");
    span.textContent = emoji.character;

    span.onclick = function() {
      addEmoji(emoji.character);
    };

    results.appendChild(span);
  });
}

async function loadDefaultEmojis() {
  const results = document.getElementById("emojiResults");
  if (!results) return;

  results.innerHTML = "Loading...";

  const response = await fetch("/api/emojis");
  const emojis = await response.json();

  renderEmojiResults(emojis);
}

async function searchEmoji() {
  const searchInput = document.getElementById("emojiSearch");
  const results = document.getElementById("emojiResults");

  if (!searchInput || !results) return;

  const keyword = searchInput.value.trim();

  if (!keyword) {
    loadDefaultEmojis();
    return;
  }

  results.innerHTML = "Loading...";

  const response = await fetch(
    `/api/emojis?search=${encodeURIComponent(keyword)}`
  );

  const emojis = await response.json();

  renderEmojiResults(emojis);
}

function toggleAttachMenu() {
  const menu = document.getElementById("attachMenu");
  if (!menu) return;

  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function(e) {

  const menu = document.getElementById("attachMenu");

  if (menu && !e.target.closest(".plus-wrapper")) {
    menu.style.display = "none";
  }
  const musicPanel = document.getElementById("onlineMusicPanel");

if (
  musicPanel &&
  musicPanel.style.display === "block" &&
  !e.target.closest("#onlineMusicPanel") &&
  !e.target.closest(".attach-menu")
) {
  musicPanel.style.display = "none";
}

const emojiPanel = document.getElementById("emojiPanel");

if (
  emojiPanel &&
  emojiPanel.classList.contains("show") &&
  !e.target.closest("#emojiPanel") &&
  !e.target.closest(".emoji-wrapper")
) {
  emojiPanel.classList.remove("show");
}
});

/* =====================
   ONLINE PHOTOS
===================== */

async function loadOnlinePhotos() {
  const searchInput = document.getElementById("onlineSearch");
  const gallery = document.getElementById("onlineGallery");
  const query = searchInput ? searchInput.value.trim() || "ocean background" : "ocean background";

  if (!gallery) return;

  gallery.innerHTML = "Loading...";

  const response = await fetch(`/api/photos?query=${encodeURIComponent(query)}`);
  const photos = await response.json();

  gallery.innerHTML = "";

  if (photos.length === 0) {
    gallery.innerHTML = "No photos found";
    return;
  }

  photos.forEach(function(photo) {
    const card = document.createElement("div");
    card.className = "online-photo";

    const img = document.createElement("img");
    img.src = photo.preview;
    img.alt = photo.title || "Online background";

    const mark = document.createElement("span");
    mark.className = "photo-check";
    mark.textContent = "OK";

    card.appendChild(img);
    card.appendChild(mark);

    card.onclick = function() {
      selectedOnlineImage = photo.full;

      document.querySelectorAll(".online-photo").forEach(function(item) {
        item.classList.remove("selected");
      });

      card.classList.add("selected");
    };

    gallery.appendChild(card);
  });
}

/* =====================
   ONLINE MUSIC
===================== */

function toggleOnlineMusicPanel() {
  const panel = document.getElementById("onlineMusicPanel");
  const emojiPanel = document.getElementById("emojiPanel");
  const attachMenu = document.getElementById("attachMenu");

  if (!panel) return;

  if (emojiPanel) emojiPanel.style.display = "none";
  if (attachMenu) attachMenu.style.display = "none";

  panel.style.display =
    panel.style.display === "block" ? "none" : "block";
}

async function loadOnlineMusic() {
  const searchInput = document.getElementById("musicSearch");
  const results = document.getElementById("musicResults");
  const query = searchInput ? searchInput.value.trim() || "lofi" : "lofi";

  if (!results) return;

  results.innerHTML = "Loading...";

  const response = await fetch(`/api/music?query=${encodeURIComponent(query)}`);
  const songs = await response.json();

  results.innerHTML = "";

  if (songs.length === 0) {
    results.innerHTML = "No music found";
    return;
  }

  songs.forEach(function(song) {
    const item = document.createElement("div");
    item.className = "music-result";

    item.innerHTML = `
      <div>
        <strong>${song.title}</strong>
        <p>${song.artist}</p>
        <audio controls src="${song.url}"></audio>
        <button type="button">Send</button>
      </div>
    `;

    item.querySelector("button").onclick = function() {
      sendOnlineMusic(song.title, song.url);
    };

    results.appendChild(item);
  });
}

async function sendOnlineMusic(title, url) {
  const roomName = localStorage.getItem("roomName") || "Chat";

  await fetch("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      room: roomName,
      text: JSON.stringify({
        title: title,
        url: url
      }),
      type: "music",
      senderId: myUserId
    })
  });

  loadMessages();
  const musicPanel = document.getElementById("onlineMusicPanel");
if (musicPanel) musicPanel.style.display = "none";
}

/* =====================
   PAGE INIT
===================== */

document.addEventListener("DOMContentLoaded", function() {
  initPrettySelects();
  loadCreatedRooms();
  startChatPolling();

  const roomTitle = document.getElementById("roomTitle");

  if (roomTitle) {
    const roomName = localStorage.getItem("roomName") || "Chat";
    const backgroundType = localStorage.getItem("backgroundType");

    roomTitle.textContent = roomName;

    if (backgroundType === "image" || backgroundType === "online") {
      document.body.style.backgroundImage =
        `url(${localStorage.getItem("bgImage")})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    } else {
      document.body.style.background =
        localStorage.getItem("bgColor") || "#f5d5dc";
    }
  }
});