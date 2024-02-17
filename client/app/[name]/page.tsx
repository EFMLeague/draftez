"use client";
import React, { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import Image from "next/image";
import champions from "../../public/champions/champion-summary.json" assert { type: "json" };
import PickImage from "@/app/components/pickImageLeft";
import BanImage from "@/app/components/banImageLeft";
import { Howl } from "howler";
import PickImageLeft from "@/app/components/pickImageLeft";
import PickImageRight from "../components/pickImageRight";
import BanImageRight from "../components/banImageRight";
import BanImageLeft from "@/app/components/banImageLeft";

// const socket: Socket = io("http://localhost:3001", {});
const socket: Socket = io("https://draftez.onrender.com", {});

const url = typeof window !== "undefined" ? window.location.href : "";
const startIndex = url.lastIndexOf("/");
const endIndex = url.indexOf("#");

var room = url.substring(startIndex + 1, endIndex + 1);
var passwordSide = url.substring(endIndex + 1);

if (room.length) socket.emit("join_room", { room, passwordSide });

export default function page() {
  const [side, setSide] = useState("spectator");
  const [filter, setFilter] = useState("");
  const [singleChampion, setSingleChampion] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [block, setBlock] = useState(false);

  const version = "14.3.1";
  type Champion = {
    id: number;
    name: string;
    alias: string;
    squarePortraitPath: string;
    roles: string[];
    rolesPlayed: string[];
  };
  const championsData: Champion[] = champions;

  const extractID = (champ: string) => {
    const res = champions.find(({ alias }) => alias === champ);
    return res?.id;
  };

  const idChamp = () => {
    if (singleChampion === undefined) {
      return undefined;
    } else {
      return extractID(singleChampion);
    }
  };

  const filterChampionsByRole = (champion: Champion) => {
    // Se non è stato selezionato alcun ruolo, mostra tutti i campioni
    if (!selectedRole) {
      return true;
    }

    // Controlla se il ruolo selezionato è presente nell'array dei ruoli del campione
    return champion.rolesPlayed && champion.rolesPlayed.includes(selectedRole);
  };

  const championsFiltered = championsData.filter(
    (champion: Champion) =>
      (champion.alias.toLowerCase().includes(filter.toLowerCase()) ||
        champion.name.toLowerCase().includes(filter.toLowerCase())) &&
      filterChampionsByRole(champion)
  );

  const [messageReceived, setMessageReceived] = useState({
    password: {
      blue: "",
      red: "",
    },
    draftNames: {
      teamBlue: "Blue",
      teamRed: "Red",
    },
    draftStats: {
      bluePick: [] as string[],
      redPick: [] as string[],
      banBlue: [] as string[],
      banRed: [] as string[],
    },
    draftTurn: {
      timer: "",
      side: "",
    },
    started: "false",
    blueReady: "",
    redReady: "",
    phase: 0,
    message: "",
    room: room,
    confirm: "false",
  });

  function play(src: string, type: string) {
    const sound = new Howl({ src, html5: true });
    if (type === "sfx") {
      sound.play();
      sound.volume(0.1);
    }
    if (type === "voice") {
      sound.play();
      sound.volume(0.2);
    }
    if (type === "notify") {
      sound.play();
      sound.volume(0.5);
    }
  }
  useEffect(() => {
    setBlock(false);
    const idChampion = idChamp();
    if ([0, 1, 2, 3, 4, 12, 13, 14, 15].includes(messageReceived.phase)) {
      play(
        "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/sounds/sfx-cs-draft-ban-enemy-team.ogg",
        "notify"
      );

      play(
        "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/it_it/v1/champion-ban-vo/" +
          idChampion +
          ".ogg",
        "voice"
      );
      play(
        "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-sfx-audios/" +
          idChampion +
          ".ogg",
        "sfx"
      );
    }
    if ([6, 7, 8, 9, 10, 16, 17, 18, 19].includes(messageReceived.phase)) {
      play(
        "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/sounds/sfx-cs-draft-notif-yourpick.ogg",
        "notify"
      );
      play(
        "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/it_it/v1/champion-choose-vo/" +
          idChampion +
          ".ogg",
        "voice"
      );
      play(
        "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-sfx-audios/" +
          idChampion +
          ".ogg",
        "sfx"
      );
    }
    setSingleChampion("");
  }, [messageReceived.phase]);

  useEffect(() => {
    socket.on("message_received", (data) => {
      setMessageReceived({
        password: {
          blue: data.blue,
          red: data.red,
        },
        draftNames: {
          teamBlue: data.draftInfo.draftNames.teamBlue,
          teamRed: data.draftInfo.draftNames.teamRed,
        },
        draftStats: {
          bluePick: data.draftInfo.draftStats.bluePick,
          redPick: data.draftInfo.draftStats.redPick,
          banBlue: data.draftInfo.draftStats.banBlue,
          banRed: data.draftInfo.draftStats.banRed,
        },
        draftTurn: {
          timer: data.draftInfo.draftTurn.timer,
          side: data.draftInfo.draftTurn.side,
        },
        started: data.draftInfo.started,
        blueReady: data.draftInfo.blueReady,
        redReady: data.draftInfo.redReady,
        phase: data.draftInfo.phase,
        message: data.draftInfo.message,
        confirm: data.draftInfo.confirm,
        room: room,
      });

      if (data.blue === passwordSide) setSide("blue");
      if (data.red === passwordSide) setSide("red");
    });
  }, [socket]);

  useEffect(() => {
    if (checkPhaseImage() === true && messageReceived.started === "true") {
      setSingleChamp(singleChampion);
    }
  }, [singleChampion]);

  const toggleReady = () => {
    let updatedMessageReceived = { ...messageReceived };

    if (side === "red") {
      updatedMessageReceived.redReady =
        messageReceived.redReady === "false" ? "true" : "false";
    }

    if (side === "blue") {
      updatedMessageReceived.blueReady =
        messageReceived.blueReady === "false" ? "true" : "false";
    }

    console.log(updatedMessageReceived);
    setMessageReceived(updatedMessageReceived);
    socket.emit("send_message", updatedMessageReceived);
  };

  const setSingleChamp = (championAlias: string) => {
    setSingleChampion(championAlias);
    updateMessage(championAlias);
  };

  const updateMessage = (champion: string) => {
    console.log("entrato");
    let updatedMessageReceived = { ...messageReceived };
    updatedMessageReceived.message = champion;
    console.log(updatedMessageReceived.draftStats);
    socket.emit("send_pick", updatedMessageReceived);
  };

  const checkSideButton = () => {
    if (messageReceived.started === "false") {
      if (side === "blue") {
        if (messageReceived.blueReady === "false") return "ready";
        else return "waiting";
      }
      if (side === "red") {
        if (messageReceived.redReady === "false") return "ready";
        else return "waiting";
      }
      if (side === "spectator") {
        return "spectator";
      }
    }
    if (messageReceived.started === "true") {
      if ([0, 2, 4, 6, 9, 10, 13, 15, 17, 18].includes(messageReceived.phase)) {
        if (side === "blue") return <p>pick</p>;
        if (side === "red") return <p>waiting</p>;
      } else if (
        [1, 3, 5, 7, 8, 11, 12, 14, 16, 19].includes(messageReceived.phase)
      ) {
        if (side === "blue") return <p>waiting</p>;
        if (side === "red") return <p>pick</p>;
      } else if ([20].includes(messageReceived.phase)) {
        return <p>Draft finita</p>;
      }
    }
  };
  const inviaChamp = () => {
    let updatedMessageReceived = { ...messageReceived };
    updatedMessageReceived.confirm = "true";
    setMessageReceived(updatedMessageReceived);
    socket.emit("send_pick", updatedMessageReceived);
  };

  const checkPhaseImage = () => {
    if ([0, 2, 4, 6, 9, 10, 13, 15, 17, 18].includes(messageReceived.phase)) {
      if (side === "blue") {
        console.log("blue");
        return true;
      } else return false;
    }
    if ([1, 3, 5, 7, 8, 11, 12, 14, 16, 19].includes(messageReceived.phase)) {
      if (side === "red") {
        console.log("red");
        return true;
      } else return false;
    }
  };

  const checkChampionPicked = (championName: string) => {
    return (
      messageReceived.draftStats.banBlue.includes(championName as string) ||
      messageReceived.draftStats.banRed.includes(championName as string) ||
      messageReceived.draftStats.bluePick.includes(championName as string) ||
      messageReceived.draftStats.redPick.includes(championName as string)
    );
  };

  const imagePick = (champ: string, order: number) => {
    if (order === messageReceived.phase) {
      if (checkPhaseImage() === true) {
        const champ = singleChampion;
        return {
          id: extractID(singleChampion),
          active: true,
          champName: champ,
        };
      }
      if (checkPhaseImage() === false) {
        const champ = messageReceived.message;
        return {
          id: extractID(messageReceived.message),
          active: true,
          champName: champ,
        };
      }
    }
    if (champ != undefined && order < messageReceived.phase) {
      return {
        id: extractID(champ),
        active: false,
        champName: champ,
      };
    }
    return { id: undefined, active: false, champName: "" };
  };

  const handleSelectedRole = (role: React.SetStateAction<string>) => {
    if (selectedRole === role) setSelectedRole("");
    else setSelectedRole(role);
  };
  return (
    <div
      className={
        "h-screen min-h-screen w-full absolute top-0 overflow-hidden flex-wrap transition-all background-draft "
        // + (turnSide() === "stall"
        //   ? " background-draft"
        //   : turnSide() === "red"
        //   ? " background-draft-to-red "
        //   : " background-draft-to-blue ")
      }
    >
      <div className="w-full pt-4 flex h-[8%] justify-between ">
        <div className="basis-1/4 h-full bg-[#2ec4b6] relative flex justify-center items-center ">
          <p className="text-[2.3vw] pt-[0.5vw] px-4 text-center  text-black uppercase">
            {messageReceived.draftNames.teamBlue}
          </p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 69.68 60.36"
            className="h-[80%] absolute right-0 top-2 fill-black"
          >
            <g id="Livello_2" data-name="Livello 2">
              <g id="Livello_1-2" data-name="Livello 1">
                <path d="M31,13.88,17.15,0a17.89,17.89,0,0,0,0,25.29L31,39.17l5.23,5.31,0-17.28A17.82,17.82,0,0,0,31,13.88Z" />
                <path d="M5.23,22.24a17.89,17.89,0,0,0-4,19.25A48.56,48.56,0,0,0,5.69,46.6,47.3,47.3,0,0,0,36.22,60.36,17.79,17.79,0,0,0,31,48Z" />
              </g>
            </g>
          </svg>
        </div>
        <div className="basis-1/4 h-full pt-[0.5vw] bg-[#df2935] relative flex justify-center  items-center">
          <p className="text-[2.3vw] text-center px-4 text-white uppercase">
            {messageReceived.draftNames.teamRed}
          </p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 69.68 60.36"
            className="h-[80%] absolute left-0 top-2 transform -scale-x-100 fill-white"
          >
            <g id="Livello_2" data-name="Livello 2">
              <g id="Livello_1-2" data-name="Livello 1">
                <path d="M31,13.88,17.15,0a17.89,17.89,0,0,0,0,25.29L31,39.17l5.23,5.31,0-17.28A17.82,17.82,0,0,0,31,13.88Z" />
                <path d="M5.23,22.24a17.89,17.89,0,0,0-4,19.25A48.56,48.56,0,0,0,5.69,46.6,47.3,47.3,0,0,0,36.22,60.36,17.79,17.79,0,0,0,31,48Z" />
              </g>
            </g>
          </svg>
        </div>
      </div>
      <div className="flex w-full h-[80%] ">
        <div className="basis-1/5 h-full flex shrink flex-col bg-[#00688a] p-[0.3vw] rounded-br-[30px] ">
          <PickImageLeft
            champ={imagePick(messageReceived.draftStats.bluePick[0], 6)}
          ></PickImageLeft>
          <PickImageLeft
            champ={imagePick(messageReceived.draftStats.bluePick[1], 9)}
          ></PickImageLeft>
          <PickImageLeft
            champ={imagePick(messageReceived.draftStats.bluePick[2], 10)}
          ></PickImageLeft>
          <div className="pt-[1vw]"></div>
          <PickImageLeft
            champ={imagePick(messageReceived.draftStats.bluePick[3], 17)}
          ></PickImageLeft>
          <PickImageLeft
            champ={imagePick(messageReceived.draftStats.bluePick[4], 18)}
          ></PickImageLeft>
        </div>
        <div className="basis-3/5 mx-[2vw] ">
          <div className="flex justify-between items-center relative px-10 pt-[1vw]">
            <div className="flex">
              <Image
                src={"/roles/top.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[1.5vw] w-[1.5vw] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "top"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("top")}
              ></Image>
              <Image
                src={"/roles/jng.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[1.5vw] w-[1.5vw] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "jng"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("jng")}
              ></Image>
              <Image
                src={"/roles/mid.png"}
                alt=""
                width={27}
                height={27}
                className={
                  "h-[1.5vw] w-[1.5vw] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "mid"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("mid")}
              ></Image>
              <Image
                src={"/roles/adc.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[1.5vw] w-[1.5vw] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "adc"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("adc")}
              ></Image>
              <Image
                src={"/roles/sup.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[1.5vw] w-[1.5vw] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "sup"
                    ? "brightness-100 scale-110 "
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("sup")}
              ></Image>
            </div>
            <p className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="text-[3vw] ">
                {Number(messageReceived.draftTurn.timer) > 0
                  ? messageReceived.draftTurn.timer
                  : "0"}
              </span>
            </p>
            <div className="flex justify-center items-center p-1 m-2 bg-white">
              <img src="./icons8-ricerca-50.png" className="h-[1vw] px-2"></img>
              <input
                type="text"
                placeholder="Filtra"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-full outline-none text-[1vw] pl-2 pt-1 tracking-wider"
              />
            </div>
          </div>
          <div className="w-full h-[85%] overflow-y-auto border-b-4 rounded-[30px] border-black bg-black/40">
            <div className="flex flex-wrap justify-center py-2 min-w-[200px] ">
              {championsFiltered.map((champion: any) => (
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.alias}.png`}
                  alt=""
                  width={100}
                  height={100}
                  className={
                    "h-[5.2vw] w-[5.2vw] hover:cursor-pointer m-1  " +
                    (checkChampionPicked(champion.alias)
                      ? "grayscale "
                      : " hover:grayscale hover:border ") +
                    (singleChampion === champion.alias
                      ? " grayscale border "
                      : " ")
                  }
                  key={champion.alias}
                  onClick={() => {
                    if (
                      checkPhaseImage() === true &&
                      messageReceived.started === "true" &&
                      checkChampionPicked(champion.alias) === false &&
                      block === false
                    ) {
                      setSingleChamp(champion.alias);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="basis-1/5 flex shrink flex-col items-end bg-[#ec465a] p-[0.3vw] rounded-bl-[30px] ">
          <PickImageRight
            champ={imagePick(messageReceived.draftStats.redPick[0], 7)}
          ></PickImageRight>
          <PickImageRight
            champ={imagePick(messageReceived.draftStats.redPick[1], 8)}
          ></PickImageRight>
          <PickImageRight
            champ={imagePick(messageReceived.draftStats.redPick[2], 11)}
          ></PickImageRight>
          <div className="pt-[1vw]"></div>
          <PickImageRight
            champ={imagePick(messageReceived.draftStats.redPick[3], 16)}
          ></PickImageRight>
          <PickImageRight
            champ={imagePick(messageReceived.draftStats.redPick[4], 19)}
          ></PickImageRight>
        </div>
      </div>
      <div className="flex justify-between w-full items-center mb-[0.3vw] ">
        <div className="flex h-full basis-[40%] justify-end ">
          <BanImageLeft
            champ={imagePick(messageReceived.draftStats.banBlue[0], 0)}
          ></BanImageLeft>
          <BanImageLeft
            champ={imagePick(messageReceived.draftStats.banBlue[1], 2)}
          ></BanImageLeft>
          <BanImageLeft
            champ={imagePick(messageReceived.draftStats.banBlue[2], 4)}
          ></BanImageLeft>
          <div className="px-[1vw]"></div>
          <BanImageLeft
            champ={imagePick(messageReceived.draftStats.banBlue[3], 13)}
          ></BanImageLeft>
          <BanImageLeft
            champ={imagePick(messageReceived.draftStats.banBlue[4], 15)}
          ></BanImageLeft>
        </div>
        <div className=" h-full basis-[20%] flex justify-center items-center">
          <button
            className={
              "text-[2.5vw] w-[12vw] p-[0.4vw] text-center uppercase text-white hover:cursor-pointer bordi-bottone mb-5 -tracking-tighter hover:bg-white hover:text-[#011627] " +
              (singleChampion === "" && messageReceived.started === "true"
                ? "pointer-events-none"
                : "")
            }
            onClick={() => {
              if (side != "spectator") {
                if (messageReceived.started === "false") {
                  toggleReady();
                } else {
                  if (checkPhaseImage() === true) {
                    setBlock(true);
                    inviaChamp();
                  }
                }
              }
            }}
          >
            {checkSideButton()}
          </button>
        </div>
        <div className="flex h-full basis-[40%] justify-start items-start ">
          <BanImageRight
            champ={imagePick(messageReceived.draftStats.banRed[4], 14)}
          ></BanImageRight>
          <BanImageRight
            champ={imagePick(messageReceived.draftStats.banRed[3], 12)}
          ></BanImageRight>
          <div className="px-[1vw]"></div>
          <BanImageRight
            champ={imagePick(messageReceived.draftStats.banRed[2], 5)}
          ></BanImageRight>
          <BanImageRight
            champ={imagePick(messageReceived.draftStats.banRed[1], 3)}
          ></BanImageRight>
          <BanImageRight
            champ={imagePick(messageReceived.draftStats.banRed[0], 1)}
          ></BanImageRight>
        </div>
      </div>
    </div>
  );
}
