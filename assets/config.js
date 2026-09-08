window.MK_SCORE_CONFIG = {
  // Only the public Realtime Database URL belongs here.
  // Never add a Firebase service-account JSON, private key, or Discord token.
  databaseURL: "https://mkw-kobot-default-rtdb.firebaseio.com",

  // Normally left empty. /mk overlay generates URLs with guild and board parameters.
  defaultGuildId: "",
  defaultBoardId: "",

  // OBS and the public page check for changes automatically.
  pollIntervalMs: 5000,

  // Production must fail closed when Firebase is not configured.
  // Set true only for an intentional local visual demonstration.
  demoMode: false
};
