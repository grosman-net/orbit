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
      // Fetch UFW rules
      const rules = await runCommand("sudo ufw status numbered");
      res.status(200).json({ rules });
    } else if (method === "POST") {
      const { port, protocol, action } = req.body;

      if (!port || !protocol || !action) {
        return res.status(400).json({ error: "Missing 'port', 'protocol', or 'action' in request body." });
      }

      // Add or remove UFW rule
      const command =
        action === "allow"
          ? `sudo ufw allow ${port}/${protocol}`
          : `sudo ufw deny ${port}/${protocol}`;
      await runCommand(command);

      res.status(200).json({ message: `Rule ${action}ed successfully for ${port}/${protocol}.` });
    } else if (method === "DELETE") {
      const { ruleNumber } = req.body;

      if (!ruleNumber) {
        return res.status(400).json({ error: "Missing 'ruleNumber' in request body." });
      }

      // Delete UFW rule by number
      const command = `sudo ufw delete ${ruleNumber}`;
      await runCommand(command);

      res.status(200).json({ message: `Rule number ${ruleNumber} deleted successfully.` });
    } else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
