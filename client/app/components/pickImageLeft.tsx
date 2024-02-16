import React from "react";

import "../globals.css";

export default function pickImageLeft({
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
        "h-[22%] w-[20vw]  m-1 overflow-hidden relative shadow-xl border border-black transition-all  hover:cursor-pointer " +
        (champ.id === undefined && champ?.active
          ? " pickImgEmpty h-[70%] transition-all duration-300  "
          : champ?.active && champ.id
          ? " h-[70%] transition-all duration-300 pickImg"
          : champ.id
          ? " pickImg  bordi-pick-left "
          : " pickImgEmpty pointer-events-none bordi-pick-left ")
      }
      style={{
        backgroundImage:
          champ.id === undefined
            ? ``
            : `url("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/` +
              champ.id +
              `/` +
              champ.id +
              `000.jpg")`,
      }}
    >
      <div className=" h-full w-full bg-transparent text-transparent hover:bg-black/65 hover:text-white">
        <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[1.3rem] -tracking-tight uppercase ">
          {" "}
          counter
        </p>
      </div>
      <p className="absolute left-2 bottom-0 text-gray-200 uppercase  -tracking-tight nameChampDraft">
        {champ.champName}
      </p>
    </a>
  );
}
