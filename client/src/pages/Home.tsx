import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

const socket: Socket = io(
  import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3001",
  {}
);

const url = typeof window !== "undefined" ? window.location.href : "";

const Home = () => {
  const [nameRed, setNameRed] = useState("Red");
  const [nameBlue, setNameBlue] = useState("Blue");

  const [messages, setMessages] = useState({ room: "", red: "", blue: "" });

  const [created, setCreated] = useState<boolean>(false);
  const [copied, setCopied] = useState<string>("");

  useEffect(() => {
    socket.on("message_received", (data) => {
      setMessages({ room: data.roomNumber, red: data.red, blue: data.blue });
      setCreated(true);
    });

    // Pulizia degli eventi del socket
    return () => {
      socket.off("message_received");
    };
  }, [socket]);

  const createRoom = () => {
    socket.emit("create_room", { nameBlue, nameRed });
  };

  const copyIntoClipboard = (link: string, key: string) => {
    navigator.clipboard.writeText(link);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? "" : c)), 1600);
  };

  const shareLinks = [
    {
      key: "blue",
      label: "Blue",
      link: url + messages.room + messages.blue,
      accent: "#2f6bff",
      text: "text-[#2f6bff]",
      border: "border-[#2f6bff]",
      hover: "hover:bg-[#2f6bff]",
    },
    {
      key: "red",
      label: "Red",
      link: url + messages.room + messages.red,
      accent: "#df2935",
      text: "text-[#df2935]",
      border: "border-[#df2935]",
      hover: "hover:bg-[#df2935]",
    },
    {
      key: "spec",
      label: "Spec",
      link: url + messages.room,
      accent: "#9ca3af",
      text: "text-gray-700",
      border: "border-gray-500",
      hover: "hover:bg-gray-700",
    },
  ];

  return (
    <div className="no-select min-h-screen w-full flex justify-center items-center background-draft px-4 py-10">
      {created === false ? (
        <div className="w-full max-w-xl animate-fade-in-up">
          <div className="flex flex-col justify-center items-center mb-6">
            <h1 className="text-violet-50 text-4xl sm:text-5xl md:text-6xl font-bold uppercase text-center -tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              Welcome to <span className="text-[#2ec4b6]">Easy Draft</span>
            </h1>
            <div className="accent-line-small max-w-full mt-4" />
          </div>

          <div className="glass-card w-full p-6 sm:p-8 rounded-3xl">
            <div className="flex flex-col gap-5">
              <label className="flex items-center gap-4">
                <span className="w-16 sm:w-20 text-2xl sm:text-3xl font-bold text-[#2f6bff] uppercase -tracking-tight">
                  Blue
                </span>
                <input
                  maxLength={13}
                  placeholder="Nome team blue"
                  defaultValue=""
                  onChange={(event) => setNameBlue(event.target.value)}
                  className="flex-1 bg-white/95 border-l-[10px] border-[#2f6bff] rounded-md text-2xl sm:text-3xl px-3 py-2 -tracking-tight outline-none transition-all focus:ring-2 focus:ring-[#2f6bff]/60"
                />
              </label>

              <label className="flex items-center gap-4">
                <span className="w-16 sm:w-20 text-2xl sm:text-3xl font-bold text-[#df2935] uppercase -tracking-tight">
                  Red
                </span>
                <input
                  maxLength={13}
                  placeholder="Nome team red"
                  defaultValue=""
                  onChange={(event) => setNameRed(event.target.value)}
                  className="flex-1 bg-white/95 border-l-[10px] border-[#df2935] rounded-md text-2xl sm:text-3xl px-3 py-2 -tracking-tight outline-none transition-all focus:ring-2 focus:ring-[#df2935]/60"
                />
              </label>
            </div>
          </div>

          <button
            onClick={createRoom}
            className="text-white w-full border-2 py-3 border-white/80 mt-6 text-2xl sm:text-3xl uppercase tracking-wide rounded-2xl font-semibold transition-all duration-200 hover:bg-[#2ec4b6] hover:border-[#2ec4b6] hover:text-[#011627] hover:scale-[1.02] active:scale-[0.99]"
          >
            Crea Draft
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl animate-fade-in-up">
          <div className="flex flex-col justify-center items-center mb-6">
            <h1 className="text-violet-50 text-3xl sm:text-5xl font-bold uppercase text-center -tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              The draft is ready!
            </h1>
            <div className="accent-line-small max-w-full mt-4" />
          </div>

          <div className="glass-card w-full p-5 sm:p-8 rounded-3xl flex flex-col gap-5">
            {shareLinks.map((s) => (
              <div
                key={s.key}
                className="flex flex-wrap items-center gap-3 animate-pop"
              >
                <span
                  className={
                    "w-16 sm:w-20 text-xl sm:text-3xl font-bold uppercase -tracking-tight " +
                    s.text
                  }
                  style={{ color: s.accent }}
                >
                  {s.label}
                </span>
                <input
                  type="text"
                  readOnly
                  value={s.link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="link-field flex-1 min-w-0 h-12 rounded-md text-sm sm:text-lg pl-3"
                  style={{ borderLeft: `10px solid ${s.accent}` }}
                />
                <div className="flex gap-2 sm:gap-3 ml-auto">
                  <a href={s.link} target="_blank" rel="noreferrer">
                    <div
                      className={
                        "border-2 px-4 py-2 text-base sm:text-xl bg-white uppercase text-center rounded-md transition-all duration-200 hover:text-white " +
                        s.text +
                        " " +
                        s.border +
                        " " +
                        s.hover
                      }
                    >
                      Apri
                    </div>
                  </a>
                  <button
                    onClick={() => copyIntoClipboard(s.link, s.key)}
                    className={
                      "border-2 px-4 py-2 text-base sm:text-xl bg-white uppercase text-center rounded-md transition-all duration-200 hover:text-white " +
                      (copied === s.key
                        ? "border-[#2ec4b6] text-white bg-[#2ec4b6]"
                        : s.text + " " + s.border + " " + s.hover)
                    }
                  >
                    {copied === s.key ? "Copiato!" : "Copia"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
