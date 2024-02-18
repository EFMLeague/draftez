import React from "react";
import "../globals.css";

export default function BanImageLeft({
  champ,
}: {
  champ: { id: number | undefined; active: boolean };
}) {
  return (
    <div
      className={
        "relative h-8 w-8  md:h-[4.0vw] md:w-[4.5vw] mx-[0.5vw] shadow-inner overflow-hidden banImg rounded-tr-[30px] bg-[#011627] " +
        (champ.id === undefined && champ?.active
          ? " border-white border banImg "
          : champ?.active
          ? "border-white banImg border transition-all duration-300 "
          : "banImg")
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
      id={champ.id === undefined ? "-1" : champ.id.toString()}
    >
      {champ.id !== undefined && (
        <div className="absolute inset-0 bg-gray-900 opacity-10"></div>
      )}
    </div>
  );
}
