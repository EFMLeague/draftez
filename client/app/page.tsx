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
        <div className="w-full md:w-1/3">
          <div className="flex flex-col justify-center items-center">
            <h1 className=" text-violet-50 text-[4.5rem] uppercase text-center">
              WELCOME TO EASY DRAFT!
            </h1>
          </div>
          <div className="bg-black/25 w-full h-[450px] p-[3vw] rounded-[30px]">
            <div className="flex h-1/2 justify-evenly items-center">
              <p className="text-[3.5rem] w-1/6 text-white -tracking-tighter pt-2">
                BLUE
              </p>
              <input
                maxLength={13}
                placeholder="name"
                onChange={(event) => {
                  setNameBlue(event.target.value);
                }}
                className="border-l-[14px] border-[#1261ff] w-2/3 text-[2.5rem] pl-2 -tracking-tight"
              />
            </div>
            <div className="flex  h-1/2 w-full justify-evenly items-center">
              <p className="text-[3.5rem] w-1/6 text-white -tracking-tighter pt-2">
                RED
              </p>
              <input
                maxLength={13}
                placeholder="name"
                onChange={(event) => {
                  setNameRed(event.target.value);
                }}
                className="border-l-[14px] border-[#ff1515] w-2/3 text-[2.5rem] pl-2 -tracking-tight "
              />
            </div>
          </div>
          <button
            onClick={createRoom}
            className=" text-white w-full border-4 py-1 border-white mt-7 text-[2.5rem] transition-all rounded-[30px] font-medium hover:bg-white hover:text-black"
          >
            CREA DRAFT
          </button>
        </div>
      ) : (
        <div className="w-full md:w-1/2">
          <div className="flex flex-col justify-center items-center">
            <h1 className=" text-violet-50 text-[4.5rem] uppercase text-center">
              THE DRAFT IS READY !
            </h1>
          </div>
          <div className="bg-black/25 w-full h-[600px] p-[3vw] rounded-[30px] flex flex-wrap justify-center items-center">
            <div className="flex justify-center flex-wrap items-center basis-full ">
              <p className="text-[3.5rem]  w-1/6 text-white pt-2 -tracking-tighter ">
                BLUE
              </p>
              <input
                type="text"
                value={url + messages.room + messages.blue}
                id="myInput"
                className="border-l-[14px] border-[#1261ff] w-2/3 h-[3.5rem] text-[1.5rem] pl-2 -tracking-tight "
              />
              <div className="flex justify-center gap-4 mt-2 pl-3 basis-full  ">
                <a
                  href={url + messages.room + messages.blue}
                  target="_blank"
                  className="w-1/4"
                >
                  <div className="border-2 border-black text-[2rem] text-[#1261ff] bg-white  uppercase text-center hover:bg-[#1261ff] hover:text-white">
                    apri
                  </div>
                </a>
                <div
                  className="border-2 border-black w-1/4 text-[2rem] text-[#1261ff] bg-white  uppercase text-center hover:cursor-pointer hover:bg-[#1261ff] hover:text-white"
                  onClick={() =>
                    copyIntoClipboard(url + messages.room + messages.blue)
                  }
                >
                  Copia
                </div>
              </div>
            </div>
            <div className="flex justify-center flex-wrap items-center basis-full ">
              <p className="text-[3.5rem] w-1/6 text-white  -tracking-tighter pt-2">
                RED
              </p>
              <input
                type="text"
                value={url + messages.room + messages.red}
                id="myInput"
                className="border-l-[14px] border-[#ff1515] w-2/3 h-[3.5rem] text-[1.5rem] pl-2 -tracking-tight"
              />
              <div className="flex justify-center pl-3 gap-4 mt-2 basis-full">
                <a
                  href={url + messages.room + messages.red}
                  target="_blank"
                  className="w-1/4"
                >
                  <div className="border-2 border-black text-[2rem] text-[#ff1515] bg-white  uppercase text-center hover:bg-[#ff1515] hover:text-white">
                    apri
                  </div>
                </a>
                <div
                  className="border-2 border-black w-1/4 text-[2rem] text-[#ff1515] bg-white  uppercase text-center hover:cursor-pointer hover:bg-[#ff1515] hover:text-white"
                  onClick={() =>
                    copyIntoClipboard(url + messages.room + messages.red)
                  }
                >
                  Copia
                </div>
              </div>
            </div>
            <div className="flex justify-center flex-wrap items-center basis-full">
              <p className="text-[3.5rem] w-1/6 text-white  -tracking-tighter pt-2">
                SPEC
              </p>
              <input
                type="text"
                value={url + messages.room}
                id="myInput"
                className="border-l-[14px] border-black w-2/3 h-[3.5rem] text-[1.5rem] pl-2 -tracking-tight"
              />
              <div className="flex justify-center pl-3 gap-4 mt-2 basis-full">
                <a href={url + messages.room} target="_blank" className="w-1/4">
                  <div className="border-2 border-black text-[2rem] text-black bg-white  uppercase text-center hover:bg-black hover:text-white">
                    apri
                  </div>
                </a>
                <div
                  className="border-2 border-black w-1/4 text-[2rem] text-black bg-white  uppercase text-center hover:cursor-pointer hover:bg-black hover:text-white"
                  onClick={() => copyIntoClipboard(url + messages.room)}
                >
                  Copia
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
