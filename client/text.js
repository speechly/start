const prompts = require("prompts");
const numbers = require("number-to-words");
const { getSpeechlyClient } = require("./speechly");

const argv = require("yargs").options({
  raw: {
    describe: "Output raw response only",
    type: "boolean"
  }
}).argv;
const printRaw = argv.raw;

const createParser = client => async text => {
  return new Promise((resolve, reject) => {
    client.wlu.Text({ text, languageCode: client.languageCode }, client.metadata, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

(async () => {
  try {
    const parseText = createParser(await getSpeechlyClient());
    while (true) {
      const request = await prompts({ name: "text", type: "text", message: "text" });
      if (!request.text || request.text === "quit") {
        break;
      }
      try {
        const response = await parseText(request.text);
        if (printRaw) {
          console.dir(response, { depth: null });
        } else {
          response.segments.forEach((segment, i) => {
            console.log(`Segment: ${i + 1}`);
            console.log(`Transcript: ${segment.text}`);
            console.log(`Intent: ${segment.intent ? segment.intent.intent : ""}`);
            console.log(`Entities:${segment.entities.map(entity => `${entity.entity}(${entity["value"]})`).join(" ")}`);
          });
        }
      } catch (err) {
        console.error(err);
        process.exit(2);
      }
    }
    console.log("Bye!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
