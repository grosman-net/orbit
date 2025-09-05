import { NextApiRequest, NextApiResponse } from "next";
import os from "os";
import si from "systeminformation";

interface NetworkStatsData {
  rx_bytes: number;
  tx_bytes: number;
  rx_sec: number;
  tx_sec: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const uptime = os.uptime();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    const cpuLoad = await si.currentLoad();
    const diskInfo = await si.fsSize();
    const networkStats = await si.networkStats();
    const osInfo = await si.osInfo();

    const totalMemoryGB = totalMemory / (1024 ** 3);
    const usedMemoryGB = (totalMemory - freeMemory) / (1024 ** 3);

    const mainDisk = diskInfo.find((disk) => disk.mount === '/');
    const diskTotalGB = mainDisk ? mainDisk.size / (1024 ** 3) : 0;
    const diskUsedGB = mainDisk ? mainDisk.used / (1024 ** 3) : 0;

    const networkStatsFormatted = {
      rx: networkStats[0]?.rx_bytes || 0,
      tx: networkStats[0]?.tx_bytes || 0,
      rx_sec: networkStats[0]?.rx_sec || 0,
      tx_sec: networkStats[0]?.tx_sec || 0,
    };

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      uptime,
      memory: {
        total: totalMemoryGB,
        used: usedMemoryGB,
        usage: memoryUsage,
      },
      cpu: cpuLoad.currentLoad,
      disk: {
        total: diskTotalGB,
        used: diskUsedGB,
      },
      network: networkStatsFormatted,
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
      },
    });
  } catch (error) {
    console.error("Failed to fetch server info:", error);
    res.status(500).json({ error: "Failed to fetch server info" });
  }
}
