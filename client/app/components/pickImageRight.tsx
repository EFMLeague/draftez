import React from "react";

import "../globals.css";

export default function PickImageRight({
  champ,
}: {
  champ: {
    id: number | undefined;
    active: boolean;
    champName: string;
  };
}) {
  return (
    <a
      href={
        "https://u.gg/lol/champions/" +
        champ.champName.toLowerCase() +
        "/counter"
      }
      target="_blank"
      className={
        "h-[22%] w-[17vw] m-1 overflow-hidden relative shadow-xl border border-black transition-all flex justify-center items-center bg-[#011627] hover:cursor-pointer " +
        (champ.id === undefined && champ?.active
          ? " h-[70%] transition-all duration-300 "
          : champ?.active && champ.id
          ? " h-[70%] transition-all duration-300 pickImg"
          : champ.id
          ? " pickImg bordi-pick-right "
          : " pointer-events-none bordi-pick-right ")
      }
      style={{
        backgroundImage:
          champ.id === undefined
            ? `url("https://res.cloudinary.com/dqpghflrm/image/upload/v1708104595/bg-empty-1_s1ybkn.png")`
            : `url("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/` +
              champ.id +
              `/` +
              champ.id +
              `000.jpg")`,
      }}
    >
      <img
        src="./bg-empty.png"
        className={
          "h-full w-full object-contain " +
          (champ.id === undefined ? " " : " hidden")
        }
        alt=""
      />

      <div
        className={
          " h-full w-full absolute  justify-center items-center bg-transparent text-transparent hover:bg-black/65 hover:text-white" +
          (champ.id ? " flex " : " hidden ")
        }
      >
        <p className=" text-[1.3rem] -tracking-tight uppercase "> counter</p>
      </div>

      <p className="absolute right-2 bottom-0 text-gray-200 uppercase  -tracking-tight nameChampDraft ">
        {champ.champName}
      </p>
    </a>
  );
}
