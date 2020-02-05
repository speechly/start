require("draftlog").into(console);

const fs = require("fs");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const prompts = require("prompts");
const uuid = require("uuid");

exports.getSpeechlyClient = async () => {
  const keys = {};
  const keyfile = ".speechly_token";
  if (fs.existsSync(keyfile)) {
    try {
      const storedKeys = JSON.parse(fs.readFileSync(keyfile));
      Object.assign(keys, storedKeys);
      if (new Date() - new Date(keys.issued) > 1000 * 60) {
        console.log("token is too old");
        keys.issued = undefined;
      }
    } catch (err) {
      console.error("Invalid token file, recreating");
    }
  }
  if (keys.issued === undefined) {
    if (keys.appId === undefined) {
      const response = await prompts([
        { name: "appId", type: "text", message: "appId" },
        { name: "languageCode", type: "text", message: "languageCode", initial: "en-US" }
      ]);
      keys.appId = response.appId;
      keys.languageCode = response.languageCode;
    }
    if (keys.deviceId === undefined) {
      keys.deviceId = uuid.v4();
    }
    const client = createSpeechlyClient();
    keys.token = await new Promise((resolve, reject) => {
      client.identity.Login({ appId: keys.appId, deviceId: keys.deviceId }, (err, response) => {
        if (err) {
          return reject(err);
        }
        console.log(`Logged in device ${keys.deviceId} to application ${keys.appId}`);
        return resolve(response.token);
      });
    });
    keys.issued = new Date().toISOString();
    fs.writeFileSync(keyfile, JSON.stringify(keys, undefined, 2));
  }
  return createSpeechlyClient(keys.token, keys.languageCode);
};

const createSpeechlyClient = (token, languageCode) => {
  let host = "api.speechly.com";
  let creds = grpc.credentials.createSsl();
  if (process.env["URL"] !== undefined) {
    host = process.env["URL"];
    creds = grpc.credentials.createInsecure();
  }
  const Speechly = grpc.loadPackageDefinition(
    protoLoader.loadSync("../speechly.proto", {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    })
  );

  let metadata = undefined;
  if (token !== undefined) {
    //const speechlyCreds = grpc.credentials.createFromMetadataGenerator((args, callback) => {
    metadata = new grpc.Metadata();
    metadata.add("Authorization", `Bearer ${token}`);
    //   callback(null, metadata);
    // });
    // creds = grpc.credentials.combineChannelCredentials(creds, speechlyCreds);
  }

  return {
    languageCode,
    metadata,
    slu: new Speechly.v1.SLU(host, creds),
    wlu: new Speechly.v1.WLU(host, creds),
    identity: new Speechly.v1.Identity(host, creds)
  };
};
