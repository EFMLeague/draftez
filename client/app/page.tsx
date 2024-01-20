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

  return (
    <div className="bg-white h-screen flex justify-center items-center background-draft text-white">
      {created === false ? (
        <div>
          <div>
            <p>BLUE TEAM NAME</p>
            <input
              placeholder="Blue"
              onChange={(event) => {
                setNameBlue(event.target.value);
              }}
              className="border-2 border-black"
            />
          </div>
          <div>
            <p>RED TEAM NAME</p>
            <input
              placeholder="Red"
              onChange={(event) => {
                setNameRed(event.target.value);
              }}
              className="border-2 border-black"
            />
          </div>
          <button onClick={createRoom}>Create Room</button>
        </div>
      ) : (
        <div>
          <p>Room Created</p>
          <div>
            <p>BLUE TEAM LINK</p>
            <a href={url + messages.room + messages.blue} target="_blank">
              <p>{url + messages.room + messages.blue}</p>
            </a>
          </div>
          <div>
            <p>RED TEAM NAME</p>
            <a href={url + messages.room + messages.red} target="_blank">
              <p>{url + messages.room + messages.red}</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
