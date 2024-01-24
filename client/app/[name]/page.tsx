"use client";
import React, { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import Image from "next/image";
import champions from "../../public/champions/champion-summary.json" assert { type: "json" };
import PickImage from "@/app/components/pickImage";
import BanImage from "@/app/components/banImage";
import { Howl } from "howler";

// const socket: Socket = io("http://localhost:3001", {});
const socket: Socket = io("https://draftez.onrender.com", {});
const url = typeof window !== "undefined" ? window.location.href : "";
const startIndex = url.lastIndexOf("/");
const endIndex = url.indexOf("$");

var room = url.substring(startIndex + 1, endIndex + 1);
var passwordSide = url.substring(endIndex + 1);

if (room.length) socket.emit("join_room", { room, passwordSide });

export default function page() {
  const [side, setSide] = useState("spectator");
  const [filter, setFilter] = useState("");
  const [singleChampion, setSingleChampion] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [block, setBlock] = useState(false);

  const version = "14.1.1";
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
      teamBlue: "",
      teamRed: "",
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
    console.log(side);
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
      }
      if ([1, 3, 5, 7, 8, 11, 12, 14, 16, 19].includes(messageReceived.phase)) {
        if (side === "blue") return <p>waiting</p>;
        if (side === "red") return <p>pick</p>;
      }
      if ([20].includes(messageReceived.phase)) {
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
  const turnSide = () => {
    if (
      messageReceived.phase === 20 ||
      (messageReceived.phase === 0 && messageReceived.started === "false")
    ) {
      return "stall";
    } else {
      if ([0, 2, 4, 6, 9, 10, 13, 15, 17, 18].includes(messageReceived.phase)) {
        return "blue";
      } else return "red";
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
        "h-screen min-h-screen w-full absolute top-0 overflow-hidden flex-wrap transition-all " +
        (turnSide() === "stall"
          ? " background-draft"
          : turnSide() === "red"
          ? "background-draft-to-red"
          : "background-draft-to-blue")
      }
    >
      <div className="my-4 w-full flex justify-between ">
        <div className="basis-1/5 bg-slate-200">
          <p className="text-[2.5rem] px-4 font-bold text-blue-950">
            {messageReceived.draftNames.teamBlue}
          </p>
        </div>
        <div className="basis-1/5 bg-slate-200">
          <p className="text-[2.5rem] text-end px-4 font-bold text-red-950">
            {messageReceived.draftNames.teamRed}
          </p>
        </div>
      </div>
      <div className="flex w-full h-[75%] ">
        <div className="basis-1/5 h-full flex shrink flex-col">
          <PickImage
            champ={imagePick(messageReceived.draftStats.bluePick[0], 6)}
          ></PickImage>
          <PickImage
            champ={imagePick(messageReceived.draftStats.bluePick[1], 9)}
          ></PickImage>
          <PickImage
            champ={imagePick(messageReceived.draftStats.bluePick[2], 10)}
          ></PickImage>
          <div className="pt-5"></div>
          <PickImage
            champ={imagePick(messageReceived.draftStats.bluePick[3], 17)}
          ></PickImage>
          <PickImage
            champ={imagePick(messageReceived.draftStats.bluePick[4], 18)}
          ></PickImage>
        </div>
        <div className="basis-3/5 ">
          <div className="flex justify-between items-center relative px-10">
            <div className="flex">
              <Image
                src={"/roles/top.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[48px] w-[48px] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "top"
                    ? "brightness-100 scale-110"
                    : "brightness-[80%]")
                }
                onClick={() => handleSelectedRole("top")}
              ></Image>
              <Image
                src={"/roles/jng.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[48px] w-[48px] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "jng"
                    ? "brightness-100 scale-110"
                    : "brightness-[80%]")
                }
                onClick={() => handleSelectedRole("jng")}
              ></Image>
              <Image
                src={"/roles/mid.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[48px] w-[48px] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "mid"
                    ? "brightness-100 scale-110"
                    : "brightness-[80%]")
                }
                onClick={() => handleSelectedRole("mid")}
              ></Image>
              <Image
                src={"/roles/adc.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[48px] w-[48px] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "adc"
                    ? "brightness-100 scale-110"
                    : "brightness-[80%]")
                }
                onClick={() => handleSelectedRole("adc")}
              ></Image>
              <Image
                src={"/roles/sup.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-[48px] w-[48px] hover:cursor-pointer m-2 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "sup"
                    ? "brightness-100 scale-110 "
                    : "brightness-[80%]")
                }
                onClick={() => handleSelectedRole("sup")}
              ></Image>
            </div>
            <p className="text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="text-[4rem] font-bold">
                {Number(messageReceived.draftTurn.timer) > 0
                  ? messageReceived.draftTurn.timer
                  : "0"}
              </span>
            </p>
            <div>
              <input
                type="text"
                placeholder="Filtra per nome"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 border border-black font-bold text-[1.5rem]"
              />
            </div>
          </div>
          <div className="w-full h-[70%] overflow-y-auto border-b-4 rounded-md border-black bg-black/40">
            <div className="flex flex-wrap justify-center py-2 min-w-[200px] ">
              {championsFiltered.map((champion: any) => (
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.alias}.png`}
                  alt=""
                  width={100}
                  height={100}
                  className={
                    "h-[110px] w-[110px] hover:cursor-pointer m-1 " +
                    (checkChampionPicked(champion.alias) ? "grayscale " : "")
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
        <div className="basis-1/5 flex shrink flex-col items-end">
          <PickImage
            champ={imagePick(messageReceived.draftStats.redPick[0], 7)}
          ></PickImage>
          <PickImage
            champ={imagePick(messageReceived.draftStats.redPick[1], 8)}
          ></PickImage>
          <PickImage
            champ={imagePick(messageReceived.draftStats.redPick[2], 11)}
          ></PickImage>
          <div className="pt-5"></div>
          <PickImage
            champ={imagePick(messageReceived.draftStats.redPick[3], 16)}
          ></PickImage>
          <PickImage
            champ={imagePick(messageReceived.draftStats.redPick[4], 19)}
          ></PickImage>
        </div>
      </div>
      <div className="flex justify-between items-center pt-3">
        <div className="flex h-full">
          <BanImage
            champ={imagePick(messageReceived.draftStats.banBlue[0], 0)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banBlue[1], 2)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banBlue[2], 4)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banBlue[3], 13)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banBlue[4], 15)}
          ></BanImage>
        </div>
        <div className=" h-full flex justify-center items-center ">
          <button
            className={
              "p-4 bg-white font-bold text-[1.5rem] w-64 uppercase hover:cursor-pointer " +
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
        <div className="flex h-full justify-center items-start ">
          <BanImage
            champ={imagePick(messageReceived.draftStats.banRed[4], 14)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banRed[3], 12)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banRed[2], 5)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banRed[1], 3)}
          ></BanImage>
          <BanImage
            champ={imagePick(messageReceived.draftStats.banRed[0], 1)}
          ></BanImage>
        </div>
      </div>
    </div>
  );
}
