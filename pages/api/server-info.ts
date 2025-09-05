import { NextApiRequest, NextApiResponse } from "next";
import os from "os";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const uptime = os.uptime();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const cpuLoad = os.loadavg();

  res.status(200).json({
    uptime,
    totalMemory,
    freeMemory,
    cpuLoad,
  });
}
