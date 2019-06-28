const fs = require("fs");
const protoLoader = require("@grpc/proto-loader");
const grpc = require("grpc");
const wav = require("wav");

const appId = process.env.APP_ID;
if (appId === undefined) {
  throw new Error("APP_ID environment variable needs to be set");
}

let host = "api.speechgrinder.com";
let credentials = grpc.credentials.createSsl();

const SgGrpc = grpc.loadPackageDefinition(
  protoLoader.loadSync("../sg.proto", {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })
);

const login = (deviceId, appId) => {
  return new Promise((resolve, reject) => {
    const identity = new SgGrpc.speechgrinder.sgapi.v1.Identity(host, credentials);
    identity.login({ appId, deviceId }, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response.token);
    });
  });
};

const start = slu => {
  const audio = new wav.Reader();

  slu.write({ config: { channels: 1, sampleRateHertz: 16000 } });
  slu.write({ event: { event: "START" } });

  audio.on("data", audioData => {
    if (slu.writable) {
      slu.write({ audio: audioData });
    }
  });
  slu.on("data", data => {
    console.dir(data, { depth: null });
  });
  audio.on("end", () => {
    slu.write({ event: { event: "STOP" } });
    slu.end();
  });
  fs.createReadStream("../audio.wav").pipe(audio);
};

Promise.resolve()
  .then(() => login("node-simple-test", appId))
  .catch(err => {
    console.error(err);
    process.exit();
  })
  .then(token => {
    const metadata = new grpc.Metadata();
    metadata.add("Authorization", `Bearer ${token}`);
    const client = new SgGrpc.speechgrinder.sgapi.v1.Slu(host, credentials);
    const slu = client.Stream(metadata);
    return start(slu);
  })
  .catch(err => {
    console.error(err);
  });
