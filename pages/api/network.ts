import { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";

// Utility function to execute shell commands
const runCommand = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    if (method === "GET") {
      // Fetch network interfaces
      const interfaces = await runCommand("ip -o link show | awk -F': ' '{print $2}'");
      const statuses = await runCommand("ip -o link show | awk '{print $9}'");

      const interfaceList = interfaces
        .split("\n")
        .filter(Boolean)
        .map((name, index) => ({
          name,
          status: statuses.split("\n")[index] === "UP",
        }));

      res.status(200).json({ interfaces: interfaceList });
    } else if (method === "POST") {
      const { name, action } = req.body;

      if (!name || !action) {
        return res.status(400).json({ error: "Missing 'name' or 'action' in request body." });
      }

      // Enable or disable network interface
      const command = action === "enable" ? `sudo ip link set ${name} up` : `sudo ip link set ${name} down`;
      await runCommand(command);

      res.status(200).json({ message: `Interface ${name} ${action}d successfully.` });
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
