const config = {
  mastodon: {
    apiClientToken: "",
    apiBaseUrl: "",
    maxPostLength: 500,
  },
  blueSky: {
    serviceUrl: "",
    username: "",
    password: "",
  },
  cdk: {
    region: "us-east-1",
    account: "YOURACCOUNT",
  },
  lambda: {
    dev: {
      postVisibility: "direct",
      postSchedule: { minute: "0", hour: "12" },
      enable: false,
    },
    prod: {
      postVisibility: "public",
      postSchedule: { minute: "0", hour: "16" },
      enable: true,
    },
  },
  haikubox: {
    apiBaseUrl: "https://api.haikubox.com/",
    serialNumber: "",
  },
};
export { config };
