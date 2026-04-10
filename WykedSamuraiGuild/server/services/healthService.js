export const getHealthStatus = () => {
  return {
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  };
};
