const prompts = require("prompts");
const numbers = require("number-to-words");
const { getSpeechlyClient, getPrinter } = require("./speechly");

const isNumeric = num => !isNaN(num);

const parseMonths = word => {
  const wordClean = word.toLowerCase();
  if (wordClean === "jan." || wordClean === "jan") {
    return "january";
  } else if (wordClean === "feb." || wordClean === "feb") {
    return "february";
  } else if (wordClean === "mar." || wordClean === "mar") {
    return "march";
  } else if (wordClean === "apr." || wordClean === "apr") {
    return "april";
  } else if (wordClean === "jun." || wordClean === "jun") {
    return "june";
  } else if (wordClean === "jul." || wordClean === "jul") {
    return "july";
  } else if (wordClean === "aug." || wordClean === "aug") {
    return "august";
  } else if (wordClean === "sept." || wordClean === "sept") {
    return "september";
  } else if (wordClean === "oct." || wordClean === "oct") {
    return "october";
  } else if (wordClean === "nov." || wordClean === "nov") {
    return "november";
  } else if (wordClean === "dec." || wordClean === "dec") {
    return "december";
  } else {
    return word;
  }
};

const parseDollars = word => {
  const prefix = word.slice(0, 1);
  const suffix = word.slice(1);
  if (prefix === "$" && isNumeric(suffix)) {
    if (suffix === "1") {
      return [suffix, "dollar"];
    } else {
      return [suffix, "dollars"];
    }
  } else {
    return [word];
  }
};

const parseOrdinal = word => {
  const wordClean = word.replace(",", "");
  const prefix = wordClean.toLowerCase().slice(0, wordClean.length - 2);
  const suffix = wordClean.toLowerCase().slice(-2);
  if ((suffix === "st" || suffix === "nd" || suffix === "rd" || suffix === "th") && isNumeric(prefix)) {
    return numbers.toWordsOrdinal(parseFloat(prefix)).split("-");
  } else {
    return [word];
  }
};

const parseNumbers = token => (isNumeric(token) ? toWords(token) : token);

const toWords = num => {
  var values = num.split(".");
  if (values.length === 1) {
    return numbers.toWords(parseFloat(values[0])).replace(/,|-/g, " ");
  } else if (values.length === 2) {
    const wholeNumber = numbers.toWords(parseFloat(values[0])).replace(/,|-/g, " ");
    const decimal = numbers.toWords(parseFloat(values[1])).replace(/,|-/g, " ");
    return `${wholeNumber} point ${decimal}`;
  } else {
    return num;
  }
};

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
        const query = request.text
          .trim()
          .split(" ")
          .filter(Boolean)
          .map(parseMonths)
          .flatMap(parseOrdinal)
          .flatMap(parseDollars)
          .map(parseNumbers)
          .join(" ")
          .replace(/\.|\?|,/g, " ")
          .trim();

        const response = await parseText(query);
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
