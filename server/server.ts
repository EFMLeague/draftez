import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";

interface DraftNames {
  teamBlue: string;
  teamRed: string;
}

interface DraftStats {
  bluePick: string[];
  redPick: string[];
  banBlue: string[];
  banRed: string[];
}

interface DraftTurn {
  timer: number;
  side: string;
}

interface DraftInfo {
  draftNames: DraftNames;
  draftStats: DraftStats;
  draftTurn: DraftTurn;
  started: boolean;
  blueReady: boolean;
  redReady: boolean;
  phase: number;
  message: string;
  confirm: boolean;
}

interface Room {
  roomNumber: string;
  blue: string;
  red: string;
  draftInfo: DraftInfo;
}

// Payload client -> server
interface CreateRoomPayload {
  nameBlue: string;
  nameRed: string;
}

interface JoinRoomPayload {
  room: string;
  passwordSide: string;
}

// send_message / send_pick: il client invia tutto lo state flat,
// il server legge solo questo sottoinsieme.
interface ClientDraftMessage {
  room: string;
  redReady: boolean;
  blueReady: boolean;
  confirm: boolean;
  message: string;
  phase: number;
}

// Mappe eventi tipizzate per Socket.IO
interface ClientToServerEvents {
  create_room: (data: CreateRoomPayload) => void;
  print_room: () => void;
  join_room: (data: JoinRoomPayload) => void;
  send_message: (data: ClientDraftMessage) => void;
  send_pick: (data: ClientDraftMessage) => void;
}

interface ServerToClientEvents {
  message_received: (room: Room) => void;
}

// Stato runtime per room: un solo driver di draft per room, gestione
// timer/avanzamento fase event-driven e conteggio connessioni per il cleanup.
interface RoomRuntime {
  timer: NodeJS.Timeout | null;
  // Conferma della fase corrente: registra la pick e chiude la fase.
  resolvePhase: (() => void) | null;
  // Chiusura "neutra" della fase (usata per la cancellazione).
  settle: (() => void) | null;
  connections: number;
  running: boolean;
  cancelled: boolean;
  // Draft concluso: la stanza è in attesa di rimozione via TTL.
  finished: boolean;
  // Timer del TTL della stanza terminata.
  ttlTimer: NodeJS.Timeout | null;
}

// TTL di una stanza terminata: resta consultabile per 20 minuti, poi viene liberata.
const FINISHED_ROOM_TTL_MS = 20 * 60 * 1000;

// Configurazione via env (con default per lo sviluppo locale).
const PORT = Number(process.env.PORT) || 3001;
// CORS_ORIGIN può essere una lista separata da virgole.
const CORS_ORIGIN = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const app = express();
const server = createServer(app);
// Il codice del tuo server Socket.IO
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

const activeRooms: Room[] = [];
const runtimes: Record<string, RoomRuntime> = {};
// Room a cui ogni socket si è unito, per decrementare le connessioni al disconnect.
const socketRooms = new Map<string, Set<string>>();

const generateRandomLink = (): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const linkLength = 10;
  let randomLink = "";

  for (let i = 0; i < linkLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomLink += characters[randomIndex];
  }

  return randomLink + "#";
};

const printRooms = (active: Room[]): void => {
  active.forEach((element) => {
    console.log(element);
  });
};

const getRuntime = (roomNumber: string): RoomRuntime => {
  let rt = runtimes[roomNumber];
  if (!rt) {
    rt = {
      timer: null,
      resolvePhase: null,
      settle: null,
      connections: 0,
      running: false,
      cancelled: false,
      finished: false,
      ttlTimer: null,
    };
    runtimes[roomNumber] = rt;
  }
  return rt;
};

app.use(express.static("public"));

app.get("/random", (req: Request, res: Response) =>
  res.status(200).json({ message: generateRandomLink() })
);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("create_room", (data) => {
    console.log("creazione room richiesta");
    const newRooms: Room = {
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
        started: false,
        blueReady: false,
        redReady: false,
        phase: 0,
        message: "",
        confirm: false,
      },
    };
    activeRooms.push(newRooms);
    getRuntime(newRooms.roomNumber);
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
    if (!res) {
      console.log(`la room non esiste`);
      return;
    }
    const sender =
      res.red === data.passwordSide || res.blue === data.passwordSide
        ? res.red === data.passwordSide
          ? "red"
          : "blue"
        : "spectator";
    console.log("mi sono unito come:" + sender);

    socket.join(data.room);

    // Traccia la connessione alla room per il cleanup al disconnect.
    let joined = socketRooms.get(socket.id);
    if (!joined) {
      joined = new Set<string>();
      socketRooms.set(socket.id, joined);
    }
    if (!joined.has(data.room)) {
      joined.add(data.room);
      getRuntime(data.room).connections++;
    }

    console.log(res);
    io.to(data.room).emit("message_received", res);
  });

  socket.on("send_message", (data) => {
    const res = activeRooms.find(({ roomNumber }) => roomNumber === data.room);
    if (!res) return;
    console.log(res);
    if (!res.draftInfo.started) {
      console.log("aggiornamento");
      res.draftInfo.redReady = data.redReady;
      res.draftInfo.blueReady = data.blueReady;
      console.log(res);
      io.to(data.room).emit("message_received", res);
      if (res.draftInfo.redReady && res.draftInfo.blueReady) {
        res.draftInfo.started = true;
        io.to(data.room).emit("message_received", res);
        console.log("draft iniziata");
        // Un solo driver per room: evita i loop concorrenti.
        const rt = getRuntime(res.roomNumber);
        if (!rt.running) {
          rt.running = true;
          void runDraft(res);
        }
      }
    }
  });

  socket.on("send_pick", (data) => {
    const room = activeRooms.find(({ roomNumber }) => roomNumber === data.room);
    if (!room) return;
    if (!room.draftInfo.started) return;
    // Ignora messaggi di una fase non più corrente (conferme doppie/stantie).
    if (data.phase !== room.draftInfo.phase) return;

    // Aggiorna anteprima/conferma e notifica tutti.
    handleDraftInfoUpdate(room, data);
    io.to(room.roomNumber).emit("message_received", room);

    if (data.confirm) {
      // Sblocca la fase corrente (se in attesa). Il driver registra la
      // pick e avanza: niente più loop multipli per ogni conferma.
      const rt = getRuntime(room.roomNumber);
      const resolve = rt.resolvePhase;
      rt.resolvePhase = null;
      if (resolve) resolve();
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const joined = socketRooms.get(socket.id);
    if (joined) {
      for (const roomNumber of joined) {
        const rt = runtimes[roomNumber];
        if (rt) {
          rt.connections--;
          // Le stanze già terminate restano in vita fino allo scadere del TTL.
          if (rt.connections <= 0 && !rt.finished) {
            // Room abbandonata (draft non concluso): ferma tutto e liberala.
            removeRoom(roomNumber);
          }
        }
      }
      socketRooms.delete(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function handleDraftInfoUpdate(room: Room, data: ClientDraftMessage): void {
  room.draftInfo.message = data.message;
  room.draftInfo.confirm = data.confirm;
}

// Registra il messaggio corrente (pick/ban) nell'array corretto in base alla fase.
function recordPick(room: Room, message: string): void {
  const { draftStats, phase } = room.draftInfo;

  if ([0, 2, 4, 13, 15].includes(phase)) {
    draftStats.banBlue.push(message);
  }
  if ([6, 9, 10, 17, 18].includes(phase)) {
    draftStats.bluePick.push(message);
  }
  if ([1, 3, 5, 12, 14].includes(phase)) {
    draftStats.banRed.push(message);
  }
  if ([7, 8, 11, 16, 19].includes(phase)) {
    draftStats.redPick.push(message);
  }
}

// Driver unico del draft: scorre le 20 fasi in sequenza.
async function runDraft(room: Room): Promise<void> {
  const rt = getRuntime(room.roomNumber);
  while (room.draftInfo.phase < 20 && !rt.cancelled) {
    await runPhase(room);
    if (rt.cancelled) return;
    room.draftInfo.phase++;
    resetDraftInfoForNextPhase(room);
    io.to(room.roomNumber).emit("message_received", room);
  }
  if (rt.cancelled) return;

  console.log("draft finita");
  console.log(room.draftInfo);

  // Stanza conclusa: resta consultabile, poi viene rimossa allo scadere del TTL.
  rt.finished = true;
  rt.ttlTimer = setTimeout(() => removeRoom(room.roomNumber), FINISHED_ROOM_TTL_MS);
}

// Una singola fase: parte il countdown e si attende la conferma del lato
// attivo oppure lo scadere del timer (auto-pick). Risolve in entrambi i casi.
function runPhase(room: Room): Promise<void> {
  const rt = getRuntime(room.roomNumber);
  return new Promise<void>((resolve) => {
    if (rt.cancelled) {
      resolve();
      return;
    }

    room.draftInfo.draftTurn.timer = 30;

    const settle = (): void => {
      if (rt.timer) {
        clearInterval(rt.timer);
        rt.timer = null;
      }
      rt.resolvePhase = null;
      rt.settle = null;
      resolve();
    };

    rt.settle = settle;
    rt.resolvePhase = (): void => {
      recordPick(room, room.draftInfo.message);
      settle();
    };

    rt.timer = setInterval(() => {
      if (rt.cancelled) {
        settle();
        return;
      }
      room.draftInfo.draftTurn.timer--;
      io.to(room.roomNumber).emit("message_received", room);

      if (room.draftInfo.draftTurn.timer <= -3) {
        // Timeout: auto-pick del messaggio corrente (anche vuoto).
        recordPick(room, room.draftInfo.message);
        settle();
      }
    }, 1000);
  });
}

// Ferma il draft e rimuove la room (fine TTL o abbandono).
function removeRoom(roomNumber: string): void {
  const rt = runtimes[roomNumber];
  if (rt) {
    rt.cancelled = true;
    if (rt.timer) {
      clearInterval(rt.timer);
      rt.timer = null;
    }
    if (rt.ttlTimer) {
      clearTimeout(rt.ttlTimer);
      rt.ttlTimer = null;
    }
    const settle = rt.settle;
    rt.settle = null;
    rt.resolvePhase = null;
    delete runtimes[roomNumber];
    // Sblocca un'eventuale fase in attesa così il driver può terminare.
    if (settle) settle();
  }

  const index = activeRooms.findIndex((r) => r.roomNumber === roomNumber);
  if (index !== -1) {
    activeRooms.splice(index, 1);
  }
}

function resetDraftInfoForNextPhase(room: Room): void {
  room.draftInfo.confirm = false;
  room.draftInfo.message = "";
  room.draftInfo.draftTurn.timer = 30;
}
