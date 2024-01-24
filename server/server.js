const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const app = express();
const server = http.createServer(app);
// Il codice del tuo server Socket.IO
const io = new Server(server, {
  cors: {
    origin: "https://easydraft.easyforme.it",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const roomTimers = {};

const generateRandomLink = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const linkLength = 10;
  let randomLink = "";

  for (let i = 0; i < linkLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomLink += characters[randomIndex];
  }

  return randomLink + "$";
};

const printRooms = (active) => {
  active.forEach((element) => {
    console.log(element);
  });
};

var activeRooms = [];

app.use(express.static("public"));

app.get("/random", (req, res) =>
  res.status(200).json({ message: generateRandomLink() })
);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("create_room", async (data) => {
    console.log("creazione room richiesta");
    const newRooms = {
      roomNumber: generateRandomLink(),
      blue: generateRandomLink(),
      red: generateRandomLink(),
      draftInfo: {
        draftNames: {
          teamBlue: data.nameBlue === "" ? "Blue" : data.nameBlue,
          teamRed: data.nameRed === "" ? "Red" : data.nameRed,
        },
        draftStats: {
          bluePick: [],
          redPick: [],
          banBlue: [],
          banRed: [],
        },
        draftTurn: {
          timer: 30,
          side: "",
        },
        started: "false",
        blueReady: "false",
        redReady: "false",
        phase: 0,
        message: "",
        confirm: "false",
      },
    };
    activeRooms.push(newRooms);
    socket.emit("message_received", newRooms);
  });

  socket.on("print_room", () => {
    console.log("stampando le rooms");
    printRooms(activeRooms);
    console.log("fine stampa");
  });

  socket.on("join_room", (data) => {
    const res = activeRooms.find(({ roomNumber }) => roomNumber === data.room);
    console.log("password:", data.passwordSide);
    if (activeRooms.find(({ roomNumber }) => roomNumber === data.room)) {
      if (res.red === data.passwordSide || res.blue === data.passwordSide) {
        var sender = res.red === data.passwordSide ? "red" : "blue";
      } else {
        var sender = "spectator";
      }
      console.log("mi sono unito come:" + sender);
      socket.join(data.room);
      console.log(res);
      io.to(data.room).emit("message_received", res);
    } else {
      console.log(`la room non esiste`);
    }
  });

  socket.on("send_message", (data) => {
    const res = activeRooms.find(({ roomNumber }) => roomNumber === data.room);
    console.log(res);
    if (res.draftInfo.started === "false") {
      console.log("aggiornamento");
      res.draftInfo.redReady = data.redReady;
      res.draftInfo.blueReady = data.blueReady;
      console.log(res);
      io.to(data.room).emit("message_received", res);
      if (
        res.draftInfo.redReady === "true" &&
        res.draftInfo.blueReady === "true"
      ) {
        res.draftInfo.started = "true";
        io.to(data.room).emit("message_received", res);
      }
    }
    console.log("------");
    if (res.draftInfo.started === "true") {
      console.log("draft iniziata");
      startTimer(res);
    }

    if (data.passwordSide === "") {
      console.log("l'utente non può inviare messaggi");
    }
  });

  socket.on("send_pick", async (data) => {
    const room = activeRooms.find(({ roomNumber }) => roomNumber === data.room);

    if (room.draftInfo.started === "true") {
      if (data.confirm === "false") {
        handleDraftInfoUpdate(room, data);
        io.to(room.roomNumber).emit("message_received", room);
      }
      if (data.confirm === "true") {
        handleDraftInfoUpdate(room, data);
        handleDraftStatsUpdate(room, data);
        handlePhaseChange(room);
        io.to(room.roomNumber).emit("message_received", room);
      }
      await handleDraftPhases(room);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});

function handleDraftInfoUpdate(room, data) {
  room.draftInfo.message = data.message;
  room.draftInfo.confirm = data.confirm;
}

function handleDraftStatsUpdate(room, data) {
  const { draftStats, phase } = room.draftInfo;

  if ([0, 2, 4, 13, 15].includes(phase)) {
    draftStats.banBlue.push(data.message);
  }
  if ([6, 9, 10, 17, 18].includes(phase)) {
    draftStats.bluePick.push(data.message);
  }
  if ([1, 3, 5, 12, 14].includes(phase)) {
    draftStats.banRed.push(data.message);
  }
  if ([7, 8, 11, 16, 19].includes(phase)) {
    draftStats.redPick.push(data.message);
  }
}

function handleDraftStatsUpdateNotConfirmed(room) {
  const { draftStats, phase } = room.draftInfo;
  if ([0, 2, 4, 13, 15].includes(phase)) {
    draftStats.banBlue.push(room.draftInfo.message);
  }
  if ([6, 9, 10, 17, 18].includes(phase)) {
    draftStats.bluePick.push(room.draftInfo.message);
  }
  if ([1, 3, 5, 12, 14].includes(phase)) {
    draftStats.banRed.push(room.draftInfo.message);
  }
  if ([7, 8, 11, 16, 19].includes(phase)) {
    draftStats.redPick.push(room.draftInfo.message);
  }
}

function handlePhaseChange(room) {
  if (roomTimers[room.roomNumber]) {
    clearInterval(roomTimers[room.roomNumber]);
    delete roomTimers[room.roomNumber];
  }
}

async function handleDraftPhases(room) {
  while (room.draftInfo.phase < 20) {
    startTimer(room);
    await waitForPhaseChangeOrTimeout(room);
    room.draftInfo.phase++;
    resetDraftInfoForNextPhase(room);
    io.to(room.roomNumber).emit("message_received", room);
  }
  if (room.draftInfo.phase === 20) {
    clearInterval(roomTimers[room.roomNumber]);
    console.log("draft finita");
    console.log(room.draftInfo);
    const res = await supabase.from("Draft").insert({
      keyRoom: room.roomNumber,
      ban_red: [
        room.draftInfo.draftStats.banRed[0],
        room.draftInfo.draftStats.banRed[1],
        room.draftInfo.draftStats.banRed[2],
        room.draftInfo.draftStats.banRed[3],
        room.draftInfo.draftStats.banRed[4],
      ],
      ban_blue: [
        room.draftInfo.draftStats.banBlue[0],
        room.draftInfo.draftStats.banBlue[1],
        room.draftInfo.draftStats.banBlue[2],
        room.draftInfo.draftStats.banBlue[3],
        room.draftInfo.draftStats.banBlue[4],
      ],
      pick_red: [
        room.draftInfo.draftStats.redPick[0],
        room.draftInfo.draftStats.redPick[1],
        room.draftInfo.draftStats.redPick[2],
        room.draftInfo.draftStats.redPick[3],
        room.draftInfo.draftStats.redPick[4],
      ],
      pick_blue: [
        room.draftInfo.draftStats.bluePick[0],
        room.draftInfo.draftStats.bluePick[1],
        room.draftInfo.draftStats.bluePick[2],
        room.draftInfo.draftStats.bluePick[3],
        room.draftInfo.draftStats.bluePick[4],
      ],
    });
    console.log(res);
  }
}
function startTimer(room) {
  if (!roomTimers[room.roomNumber] && room.draftInfo.draftTurn.timer > -2) {
    roomTimers[room.roomNumber] = setInterval(() => {
      room.draftInfo.draftTurn.timer--;

      io.to(room.roomNumber).emit("message_received", room);

      if (room.draftInfo.draftTurn.timer === -3) {
        handleDraftStatsUpdateNotConfirmed(room);
        clearInterval(roomTimers[room.roomNumber]);
        delete roomTimers[room.roomNumber];
        handlePhaseChange(room);
        io.to(room.roomNumber).emit("message_received", room);
      }
    }, 1000);
  }
}

function waitForPhaseChangeOrTimeout(room) {
  return new Promise((resolve) => {
    const timerCheckInterval = setInterval(() => {
      if (!roomTimers[room.roomNumber] || room.draftInfo.confirm === "true") {
        clearInterval(timerCheckInterval);
        resolve();
      }
    }, 1000);
  });
}
function resetDraftInfoForNextPhase(room) {
  room.draftInfo.confirm = "false";
  room.draftInfo.message = "";
  room.draftInfo.draftTurn.timer = 30;
}
