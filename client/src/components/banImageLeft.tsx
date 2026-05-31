export default function BanImageLeft({
  champ,
}: {
  champ: { id: number | undefined; active: boolean };
}) {
  return (
    <div
      className={
        "relative h-8 w-8  md:h-[4.0vw] md:w-[4.5vw] mx-[0.5vw] shadow-inner overflow-hidden rounded-tr-[30px] bg-[#006788] transition-all duration-300 " +
        (champ.id === undefined && champ?.active
          ? " border-white border "
          : champ?.active
          ? " border-white border "
          : " ")
      }
      id={champ.id === undefined ? "-1" : champ.id.toString()}
    >
      {champ.id !== undefined && (
        <div
          key={champ.id}
          className="absolute inset-0 banImg splash-in"
          style={{
            backgroundImage: `url("https://cdn.communitydragon.org/latest/champion/${champ.id}/splash-art/centered/skin/0")`,
          }}
        />
      )}
      {champ.id !== undefined && (
        <div className="absolute inset-0 bg-gray-900 opacity-10"></div>
      )}
    </div>
  );
}
