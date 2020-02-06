const readline = require("readline");
const recorder = require("node-record-lpcm16");
const { finished, Writable } = require("stream");
const { getSpeechlyClient } = require("./speechly");

const argv = require("yargs").options({
  raw: {
    describe: "Output raw events only",
    type: "boolean"
  },
  "raw-no-tentative": {
    describe: "Output raw events only and filter tentatives out",
    type: "boolean"
  }
}).argv;
const printRaw = argv.raw;
const printRawNoTentative = argv["raw-no-tentative"];

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

getPrinter = () => {
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
    const eventType = event.streamingResponse;
    if (printRaw) {
      console.dir(event, { depth: null });
      return;
    } else if (printRawNoTentative) {
      if (!eventType.startsWith("tentative")) {
        console.dir(event, { depth: null });
      }
      return;
    }
    if (eventType === "started") return;
    if (eventType === "finished") {
      return;
    }
    const data = event[eventType];
    const audioContext = event.audioContext;
    const segmentId = event.segmentId;
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

(async function() {
  try {
    const client = await getSpeechlyClient();
    let print = getPrinter();
    const recording = recorder.record({ threshold: 0, gain: 20, sampleRate: 16000, audioType: "raw" });
    const recognize = client.slu.Stream(client.metadata);

    recognize.on("data", data => {
      print(data);
      if (data.started !== undefined) {
        console.log("--- Start new audio context ---");
        recording.stream().pipe(
          new Writable({
            write(chunk, encoding, callback) {
              if (recognize.writable) {
                recognize.write({ audio: chunk });
              }
              callback();
            }
          })
        );
      }
    });

    finished(recognize, err => {
      console.log("--- Recognize finished ---");
      if (err) {
        console.error(err);
      }
      recording.stop();
      process.exit();
    });

    process.on("SIGINT", () => {
      recording.stop();
      recognize.end();
    });

    process.stdin.on("keypress", (str, key) => {
      if (key.name === "q") {
        recording.stop();
        recognize.end();
        console.log("--- Quiting...---");
      } else if (key.name === "c" && key.ctrl) {
        recording.stop();
        recognize.end();
        process.exit(-1);
      } else {
        recognize.write({ event: { event: "STOP" } });
        recording.stop();
        recording.start();
        recognize.write({ event: { event: "START" } });
      }
    });

    const config = {
      channels: 1,
      sampleRateHertz: 16000,
      languageCode: client.languageCode
    };
    recognize.write({ config });
    recognize.write({ event: { event: "START" } });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
