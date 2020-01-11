require("draftlog").into(console);

const fs = require("fs");
const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const prompts = require("prompts");
const uuid = require("uuid");
const argv = require("yargs").argv;

const printRaw = argv.raw;

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

exports.getPrinter = () => {
  let context = {};

  const getSegmentState = key => {
    const segment = context[key] || {
      transcript: "",
      intent: "",
      entities: "",
      tentativeTranscript: "",
      tentativeIntent: "",
      tentativeEntities: "",
      transcriptDraft: console.draft(),
      intentDraft: console.draft(),
      entityDraft: console.draft()
    };
    return segment;
  };

  const getAudioContext = data => {
    if ("tentativeWords" in data) {
      return data.tentativeWords[0].audioContext;
    } else if ("tentativeEntities" in data) {
      return data.tentativeEntities[0].audioContext;
    } else {
      return data.audioContext;
    }
  };
  const getsegmentId = data => {
    if ("tentativeWords" in data) {
      return data.tentativeWords[0].segmentId;
    } else if ("tentativeEntities" in data) {
      return data.tentativeEntities[0].segmentId;
    } else {
      return data.segmentId;
    }
  };

  const drawSegment = segment => {
    const transcript = `Transcript:${segment.transcript} ${segment.tentativeTranscript}`;
    const intent = `Intent: ${segment.intent}`;
    const entities = `Entities:${segment.entities} ${segment.tentativeEntities}`;
    const terminalWidth = process.stdout.columns;

    segment.transcriptDraft(transcript.substring(Math.max(0, transcript.length - terminalWidth), transcript.length));
    segment.intentDraft(intent);
    segment.entityDraft(entities.substring(Math.max(0, entities.length - terminalWidth), entities.length));
  };
  return function(event) {
    if (printRaw) {
      console.dir(event, { depth: null });
      return;
    }
    const eventType = event.streamingResponse;
    if (eventType === "started") return;
    if (eventType === "finished") {
      return;
    }
    const data = event[eventType];
    const audioContext = getAudioContext(data);
    const segmentId = getsegmentId(data);
    const key = `${audioContext}-${segmentId}`;
    const segmentState = getSegmentState(key);
    if (eventType === "segmentEnd") {
    } else if (eventType.startsWith("tentative")) {
      if (eventType.toLowerCase().endsWith("transcript")) {
        segmentState.tentativeTranscript = data.tentativeWords.map(word => word.word).join(" ");
      } else if (eventType.toLowerCase().endsWith("entities")) {
        segmentState.tentativeEntities = data.tentativeEntities
          .map(entity => `${entity.entity}(${entity["value"]})`)
          .join(" ");
      } else if (eventType.toLowerCase().endsWith("intent")) {
        segmentState.intent = data.intent;
      }
      context[key] = segmentState;
    } else {
      if (eventType === "entity") {
        segmentState.entities = `${segmentState.entities} ${data.entity}(${data["value"]})`;
        segmentState.tentativeEntities = "";
      } else if (eventType === "intent") {
        segmentState.intent = data.intent;
      } else if (eventType === "transcript") {
        segmentState.transcript = `${segmentState.transcript} ${data.word}`;
        segmentState.tentativeTranscript = "";
      }
      context[key] = segmentState;
    }
    drawSegment(segmentState);
  };
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
