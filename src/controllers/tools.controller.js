import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { spawn } from "child_process";

const checkCmd = (cmd, args = ["--version"]) =>
  new Promise(resolve => {
    try {
      const p = spawn(cmd, args, { windowsHide: true });
      let ok = false;
      p.on("error", () => resolve(false));
      p.on("close", code => resolve(code === 0 || ok));
      p.stdout.on("data", () => (ok = true));
    } catch {
      resolve(false);
    }
  });

export const toolsHealth = asyncHandler(async (req, res) => {
  const gsCmds = [process.env.GS_BIN || "gswin64c", "gswin32c"];
  const sofficeCmd = process.env.SOFFICE_BIN || "soffice";
  const popplerCmd = process.env.POPPLER_PPM_BIN || "pdftoppm";

  const gsAvailable = (await Promise.all(gsCmds.map(c => checkCmd(c)))).some(Boolean);
  const sofficeAvailable = await checkCmd(sofficeCmd);
  const popplerAvailable = await checkCmd(popplerCmd);

  const data = {
    ghostscript: gsAvailable,
    libreoffice: sofficeAvailable,
    poppler: popplerAvailable
  };
  res.status(200).json(new ApiResponse(200, data, "Tools health"));
});
