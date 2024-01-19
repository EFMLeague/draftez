import React from "react";
import "../globals.css";

export default function BanImage({
  champ,
}: {
  champ: { id: number | undefined; active: boolean };
}) {
  return (
    <div
      className={
        "relative h-[90px] w-[90px] mx-4 shadow-inner overflow-hidden banImg border-black border-2 " +
        (champ.id === undefined && champ?.active
          ? "banImgEmpty border-yellow-800"
          : champ?.active
          ? "border-yellow-800 h-[70%] transition-all duration-300 "
          : "banImgEmpty")
      }
      style={{
        backgroundImage:
          champ.id === undefined
            ? `url("https://draftlol.dawe.gg/rectangle.png")`
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
