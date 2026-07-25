# 🎥 Connect - Video Conferencing Platform

Connect is a full-stack video conferencing application that enables real-time communication using **WebRTC** and **Socket.IO**. Users can create or join meetings, communicate through video/audio, chat in real time, and share their screens.

---

## Features

- 🎥 Real-time video conferencing
- 🎙 Audio communication
- 💬 Live chat
- 🖥 Screen sharing
- 👥 Multi-user meetings
- 🔐 Secure authentication
- 🔗 Invite users using meeting links
- 📱 Responsive interface

---

## Tech Stack

### Frontend

- React.js
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- JWT
- bcrypt

### Real-Time Communication

- WebRTC
- Socket.IO

### Deployment

- Render

---

## Architecture

```
User A
      \
       \
        WebRTC
       /
User B
       \
        \
      Socket.IO
          │
     Express Server
          │
      MongoDB
```

---

## Key Features

### Authentication

- User Registration
- User Login
- JWT Authentication
- Password Hashing using bcrypt

---

### Video Calling

- Peer-to-peer video streaming
- Audio communication
- Camera controls
- Microphone controls

---

### Screen Sharing

Users can share their screens during meetings using the browser's Screen Capture API.

---

### Real-Time Chat

Socket.IO powers

- Instant messaging
- Meeting events
- User join/leave notifications

---

### Meeting System

Users can

- Create meetings
- Join existing meetings
- Invite others through meeting links

---

## Installation

```bash
git clone <repository-url>

cd connect

npm install

npm start
```

---

## Environment Variables

```env
MONGO_URI=

JWT_SECRET=
```

---

## Future Improvements

- Meeting Recording
- Waiting Room
- Virtual Background
- Meeting Scheduling
- Participant Controls
- File Sharing

---


