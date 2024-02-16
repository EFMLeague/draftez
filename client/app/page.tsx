// pages/index.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

const socket: Socket = io("https://draftez.onrender.com", {});
// const socket: Socket = io("http://localhost:3001", {});

const url = typeof window !== "undefined" ? window.location.href : "";

const Home = () => {
  const [nameRed, setNameRed] = useState("Red");
  const [nameBlue, setNameBlue] = useState("Blue");

  const [messages, setMessages] = useState({ room: "", red: "", blue: "" });

  const [created, setCreated] = useState<boolean>(false);

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
  const printRoom = () => {
    socket.emit("print_room");
  };

  const copyIntoClipboard = (e: string) => {
    navigator.clipboard.writeText(e);
  };

  return (
    <div className="bg-white h-screen flex justify-center items-center background-draft">
      {created === false ? (
        <div>
          <div className="flex flex-col justify-center items-center">
            <h1 className=" text-violet-50 text-[4.5rem] uppercase text-center">
              BENVENUTI IN EASY DRAFT!
            </h1>
            <div className="accent-line-small"></div>
          </div>
          <div>
            <p className="text-[3.5rem] text-white  -tracking-tighter">
              <span className="text-blue-700">BLUE</span>
            </p>
            <input
              placeholder="Blue"
              onChange={(event) => {
                setNameBlue(event.target.value);
              }}
              className="border-2 border-black w-full text-[2.5rem] text-blue-900  "
            />
          </div>
          <div>
            <p className="text-[3.5rem] text-white  -tracking-tighter">
              <span className="text-red-700">RED</span>
            </p>
            <input
              placeholder="Red"
              onChange={(event) => {
                setNameRed(event.target.value);
              }}
              className="border-2 border-black w-full text-[2.5rem] text-red-900  "
            />
          </div>
          <button
            onClick={createRoom}
            className="bg-white w-full h-16 border-2 border-black mt-7 text-[2.5rem] transition-all rounded-md font-medium hover:bg-gray-300"
          >
            Crea draft
          </button>
        </div>
      ) : (
        <div className="w-1/2">
          <div className="flex flex-col justify-center items-center">
            <h1 className=" text-violet-50 text-[4.5rem] uppercase text-center">
              THE DRAFT IS READY!
            </h1>
            <div className="accent-line-small"></div>
          </div>
          <div>
            <p className="text-[3.5rem] text-white  -tracking-tighter">
              BLUE TEAM
            </p>
            <input
              type="text"
              value={url + messages.room + messages.blue}
              id="myInput"
              className="border-2 border-black w-full text-[2rem] text-blue-900 bg-white  px-2 uppercase"
            />
            <div className="flex justify-center gap-4 mt-2">
              <a
                href={url + messages.room + messages.blue}
                target="_blank"
                className="w-1/4"
              >
                <div className="border-2 border-black text-[2rem] text-blue-900 bg-white  uppercase text-center hover:bg-neutral-200">
                  apri
                </div>
              </a>
              <div
                className="border-2 border-black w-1/4 text-[2rem] text-blue-900 bg-white  uppercase text-center hover:cursor-pointer hover:bg-neutral-200"
                onClick={() =>
                  copyIntoClipboard(url + messages.room + messages.blue)
                }
              >
                Copia
              </div>
            </div>
          </div>
          <div className="w-full pt-2">
            <p className="text-[3.5rem] text-white  -tracking-tighter">
              RED TEAM
            </p>
            <input
              type="text"
              value={url + messages.room + messages.red}
              id="myInput"
              className="border-2 border-black w-full text-[2rem] text-red-900 bg-white  uppercase px-2"
            />
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <a
              href={url + messages.room + messages.red}
              target="_blank"
              className="w-1/4"
            >
              <div className="border-2 border-black text-[2rem] text-red-900 bg-white  uppercase text-center hover:bg-neutral-200">
                apri
              </div>
            </a>
            <div
              className="border-2 border-black w-1/4 text-[2rem] text-red-900 bg-white  uppercase text-center hover:cursor-pointer  hover:bg-neutral-200"
              onClick={() =>
                copyIntoClipboard(url + messages.room + messages.red)
              }
            >
              Copia
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
