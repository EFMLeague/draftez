import React, { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import { Howl } from "howler";
import champions from "../../public/champions/champion-summary.json";
import PickImageLeft from "../components/pickImageLeft";
import PickImageRight from "../components/pickImageRight";
import BanImageLeft from "../components/banImageLeft";
import BanImageRight from "../components/banImageRight";

const socket: Socket = io(
  import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3001",
  {}
);

const url = typeof window !== "undefined" ? window.location.href : "";
const startIndex = url.lastIndexOf("/");
const endIndex = url.indexOf("#");

var room = url.substring(startIndex + 1, endIndex + 1);
var passwordSide = url.substring(endIndex + 1);

export default function Room() {
  const [side, setSide] = useState("spectator");
  const [filter, setFilter] = useState("");
  const [singleChampion, setSingleChampion] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [block, setBlock] = useState(false);

  const [version, setVersion] = useState("");

  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then((res) => res.json())
      .then((versions: string[]) => setVersion(versions[0]))
      .catch((err) => console.error("Errore nel recupero della versione:", err));
  }, []);

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

  // Precarica (e mette in cache nel browser) la splash art di un campione,
  // così quando viene pickato/bannato appare subito senza "pop-in".
  const preloadedSplashes = useRef<Set<number>>(new Set());
  const preloadSplash = (id: number | undefined) => {
    if (id === undefined || preloadedSplashes.current.has(id)) return;
    preloadedSplashes.current.add(id);
    const img = new window.Image();
    img.src = `https://cdn.communitydragon.org/latest/champion/${id}/splash-art/centered/skin/0`;
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
      timer: 30,
      side: "",
    },
    started: false,
    blueReady: false,
    redReady: false,
    phase: 0,
    message: "",
    room: room,
    confirm: false,
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

  const checkOneClick = () => {};

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

    // Entriamo nella stanza solo DOPO aver registrato il listener, così lo
    // stato iniziale inviato dal server in risposta non viene perso.
    if (room.length) socket.emit("join_room", { room, passwordSide });

    // Cleanup: evita listener duplicati (StrictMode / remount).
    return () => {
      socket.off("message_received");
    };
  }, [socket]);

  useEffect(() => {
    if (checkPhaseImage() === true && messageReceived.started) {
      setSingleChamp(singleChampion);
    }
  }, [singleChampion]);

  const toggleReady = () => {
    let updatedMessageReceived = { ...messageReceived };

    if (side === "red") {
      updatedMessageReceived.redReady = !messageReceived.redReady;
    }

    if (side === "blue") {
      updatedMessageReceived.blueReady = !messageReceived.blueReady;
    }

    console.log(updatedMessageReceived);
    setMessageReceived(updatedMessageReceived);
    socket.emit("send_message", updatedMessageReceived);
  };

  const setSingleChamp = (championAlias: string) => {
    setSingleChampion(championAlias);
    preloadSplash(extractID(championAlias));
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
    if (!messageReceived.started) {
      if (side === "blue") {
        if (!messageReceived.blueReady) return "ready";
        else return "waiting";
      }
      if (side === "red") {
        if (!messageReceived.redReady) return "ready";
        else return "waiting";
      }
      if (side === "spectator") {
        return "spectator";
      }
    }
    if (messageReceived.started) {
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
    if (checkPhaseImage() === true && !block) {
      setBlock(true);
      let updatedMessageReceived = { ...messageReceived };
      // Usa il campione selezionato localmente: non dipendiamo dall'eco del
      // server per `message`, così una conferma rapida non invia un valore stale.
      updatedMessageReceived.message = singleChampion;
      updatedMessageReceived.confirm = true;
      setMessageReceived(updatedMessageReceived);
      socket.emit("send_pick", updatedMessageReceived);
    }
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
        "no-select h-screen min-h-screen w-full absolute top-0 overflow-hidden flex-wrap transition-all background-draft "
      }
    >
      <div className="w-full pt-4 flex h-[8%] justify-between ">
        <div className="basis-1/3 md:basis-1/4 h-full bg-[#2ec4b6] relative flex justify-center items-center shadow-lg shadow-[#2ec4b6]/30">
          <p className="text-[1rem] md:text-[2.3vw] pt-[0.5vw] px-4 text-center font-semibold tracking-wide text-black uppercase truncate">
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
        <div className="basis-1/3 md:basis-1/4 h-full pt-[0.5vw] bg-[#df2935] relative flex justify-center items-center shadow-lg shadow-[#df2935]/30">
          <p className="text-[1rem] md:text-[2.3vw] text-center px-4 font-semibold tracking-wide text-white uppercase truncate">
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
          <div className="flex justify-between items-center flex-wrap relative px-10 pt-[1vw]">
            <div className="flex">
              <img
                src={"/roles/top.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-4 w-4 md:h-[1.5vw] md:w-[1.5vw] hover:cursor-pointer m-2 transition-all duration-200 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "top"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("top")}
              />
              <img
                src={"/roles/jng.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-4 w-4 md:h-[1.5vw] md:w-[1.5vw] hover:cursor-pointer m-2 transition-all duration-200 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "jng"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("jng")}
              />
              <img
                src={"/roles/mid.png"}
                alt=""
                width={27}
                height={27}
                className={
                  "h-4 w-4 md:h-[1.5vw] md:w-[1.5vw] hover:cursor-pointer m-2 transition-all duration-200 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "mid"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("mid")}
              />
              <img
                src={"/roles/adc.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-4 w-4 md:h-[1.5vw] md:w-[1.5vw] hover:cursor-pointer m-2 transition-all duration-200 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "adc"
                    ? "brightness-100 scale-110"
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("adc")}
              />
              <img
                src={"/roles/sup.png"}
                alt=""
                width={100}
                height={100}
                className={
                  "h-4 w-4 md:h-[1.5vw] md:w-[1.5vw] hover:cursor-pointer m-2 transition-all duration-200 hover:brightness-100 hover:scale-110 " +
                  (selectedRole === "sup"
                    ? "brightness-100 scale-110 "
                    : "brightness-[70%]")
                }
                onClick={() => handleSelectedRole("sup")}
              />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {(() => {
                const t =
                  messageReceived.draftTurn.timer > 0
                    ? messageReceived.draftTurn.timer
                    : 0;
                const danger = messageReceived.started && t <= 10;
                return (
                  <span
                    className={
                      "flex items-center justify-center rounded-full font-bold tabular-nums text-white h-[3.6vw] w-[3.6vw] min-h-[44px] min-w-[44px] text-[2vw] border-2 transition-colors duration-300 " +
                      (messageReceived.started
                        ? danger
                          ? "border-[#df2935] bg-[#df2935]/25 timer-pulse-danger "
                          : "border-[#2ec4b6] bg-[#2ec4b6]/20 timer-pulse "
                        : "border-white/40 bg-black/30 ")
                    }
                  >
                    {t}
                  </span>
                );
              })()}
            </div>
            <div className="flex justify-center items-center px-2 py-1 m-2 bg-white rounded-lg shadow-md ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[#2ec4b6] transition-all">
              <img
                src="/icons8-ricerca-50.png"
                className="h-3 w-3 md:h-[1.1vw] md:w-[1.1vw] opacity-60 mr-1"
                draggable={false}
              ></img>
              <input
                type="text"
                placeholder="Filtra campioni…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-full bg-transparent outline-none text-sm md:text-[1vw] pl-1 tracking-wider"
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
                  draggable={false}
                  className={
                    "h-[3rem] w-[3rem] md:h-[5.2vw] md:w-[5.2vw] m-1 rounded-md transition-all duration-150 " +
                    (checkChampionPicked(champion.alias)
                      ? "grayscale opacity-50 cursor-not-allowed "
                      : "hover:cursor-pointer hover:scale-110 hover:ring-2 hover:ring-white hover:z-10 ") +
                    (singleChampion === champion.alias
                      ? " ring-2 ring-[#2ec4b6] scale-110 shadow-lg shadow-[#2ec4b6]/40 "
                      : " ")
                  }
                  key={champion.alias}
                  onMouseEnter={() => preloadSplash(extractID(champion.alias))}
                  onClick={() => {
                    if (
                      checkPhaseImage() === true &&
                      messageReceived.started &&
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
              "text-[2.5vw] w-[12vw] p-[0.4vw] text-center uppercase font-semibold text-white bordi-bottone mb-5 -tracking-tighter " +
              (singleChampion === "" && messageReceived.started
                ? "pointer-events-none opacity-40 grayscale "
                : "hover:cursor-pointer hover:bg-white hover:text-[#011627] hover:scale-105 active:scale-95 ")
            }
            onClick={() => {
              if (side != "spectator") {
                if (!messageReceived.started) {
                  toggleReady();
                } else {
                  if (checkPhaseImage() === true && !block) {
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
