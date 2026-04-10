import { getHealthStatus } from "../services/healthService.js";

export const healthCheck = (req, res) => {
  const status = getHealthStatus();
  res.type("application/json").status(200).json(status);
};
