const prompts = require("prompts");
const numbers = require("number-to-words");
const { getSpeechlyClient, getPrinter } = require("./speechly");

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
        const print = getPrinter();
        response.responses.forEach(event => print(event));
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
