import frss from "@/imgs/srvicons/frss.webp";
import nightriderz from "@/imgs/srvicons/nightriderz.webp";
import overdrive from "@/imgs/srvicons/overdrive.webp";
import ugstage from "@/imgs/srvicons/ugstage.webp";
import worldevolved from "@/imgs/srvicons/worldevolved.webp";
import wugg from "@/imgs/srvicons/wugg.webp";

const SERVER_ICONS: Record<string, string> = {
  frss: frss.src,
  nightriderz: nightriderz.src,
  nightriderz_dev: nightriderz.src,
  overdrive: overdrive.src,
  ugstage: ugstage.src,
  worldevolved: worldevolved.src,
  wugg: wugg.src,
};

export function getServerIcon(serverId: string): string | undefined {
  return SERVER_ICONS[serverId];
}
