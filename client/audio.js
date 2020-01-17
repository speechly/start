const readline = require("readline");
const recorder = require("node-record-lpcm16");
const { finished, Writable } = require("stream");
const { getSpeechlyClient, getPrinter } = require("./speechly");

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

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
