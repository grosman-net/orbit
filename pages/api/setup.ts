import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { password, language, theme } = req.body;

    // Save settings (mock implementation)
    const settings = {
      password,
      language,
      theme,
    };

    res.status(200).json({ message: "Setup completed", settings });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
