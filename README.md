# Collaborative Whiteboard — Frontend

This is the **React frontend** for the Collaborative Whiteboard project.
It provides a real-time interactive drawing interface, board management, and user collaboration features powered by **Socket.IO** and the backend API.
> Part of the **Real-Time Collaborative Whiteboard** project  
> 👉 Main repository: [Link](https://github.com/Yashaswini058/collaborative-whiteboard.git)

---

## ✨ Features

* 🎨 **Drawing Tools** – freehand drawing, erasing, and live element updates.
* 👥 **Real-Time Collaboration** – multiple users drawing on the same board simultaneously.
* 🖱️ **Cursor Sharing** – see other users’ cursors with color + name.
* 🔑 **Authentication** – login/signup with JWT integration.
* 📂 **Board Management** – create, view, and join boards.
* 🔗 **Sharing & Presence** – invite collaborators, track join/leave events.
* ⚡ **Live Sync** – all board elements are updated instantly across clients.

---

## 🛠️ Tech Stack

* React (with Hooks & Context API)
* TailwindCSS for styling
* Socket.IO-client for real-time updates
* Axios for API calls
* React Router for navigation

---

## 📂 Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   ├── store/            # Global contexts (Auth, Socket, Board)
│   ├── pages/            # Page-level views (Login, Board, Dashboard)
│   ├── utils/            # Helper functions (Api, Math etc)
│   └── App.jsx           # App entry with routes
│
├── public/               # Static assets
└── package.json
```

---

## 🔌 Socket.IO Protocol (Frontend Integration)

The frontend listens and emits the following socket events:

### Presence & Cursors

* `board:join` / `board:leave` – join or leave a board room
* `presence:join` / `presence:leave` – track collaborators
* `cursor` – send/receive live cursor position

### Drawing Lifecycle

* `element:start` – begin a new drawing element
* `element:points` – stream drawing points
* `element:update` – live patches (transformations)
* `element:commit` – persist element to DB and get finalId
* `element:erase` – remove elements

---

## 🚦 Getting Started

### Prerequisites

* Node.js (v18+)
* Backend server running (see [Backend README](../server/README.md))

### Installation

1. Clone repo and move to client folder:

   ```bash
   git clone https://github.com/your-username/whiteboard-app.git
   cd whiteboard-app/client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file in `/client`:

   ```env
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```

4. Run app:

   ```bash
   npm start
   ```

5. Open at `http://localhost:3000`

---

## 📌 Future Enhancements

* More tools (comments,sticky notes).
* Better presence indicators (avatars, typing).
* Offline support with local cache.

---
