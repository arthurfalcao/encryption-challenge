const request = require('request');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { join } = require('path');
const sha1 = crypto.createHash('sha1');

require('dotenv').config();

const token = process.env.TOKEN;
if (!token) {
  console.log('Token não setado no .env');
  return;
}

const URL = `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`;

const alfa = 'abcdefghijklmnopqrstuvwxyz';

axios
  .get(
    `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`
  )
  .then(res => {
    const dataString = JSON.stringify(res.data);
    fs.writeFileSync(join(__dirname, 'answer.json'), dataString);
  });

const answer = jsonReader('answer.json');
const decoded = main(answer);
sha1.update(decoded);

const data = {
  ...answer,
  decifrado: decoded,
  resumo_criptografico: sha1.digest('hex')
};

const dataString = JSON.stringify(data);
fs.writeFileSync(join(__dirname, 'newAnswer.json'), dataString);

const newAnswer = fs.createReadStream(join(__dirname, 'newAnswer.json'));

request(
  {
    method: 'POST',
    url: URL,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    formData: {
      answer: newAnswer
    }
  },
  (err, res, body) => {
    if (err) {
      console.log(err);
    }

    console.log(body);
  }
);

function main(challenge) {
  const { cifrado, numero_casas } = challenge;
  let decoded = [];

  for (let i = 0; i < cifrado.length; i++) {
    if (alfa.includes(cifrado[i])) {
      const position = getPosition(cifrado[i].toLowerCase());
      const current = position - numero_casas;
      let letter;

      if (current < 0) {
        const max = current + alfa.length;
        letter = alfa[max];
      } else {
        letter = alfa[current];
      }

      decoded.push(letter);
    } else {
      decoded.push(cifrado[i]);
    }
  }

  return decoded.join('');
}

function getPosition(letter) {
  for (let i = 0; i < alfa.length; i++) {
    if (alfa[i] === letter) {
      return i;
    }
  }
}

function jsonReader(file, parser = true) {
  const jsonString = fs.readFileSync(join(__dirname, file));

  if (parser) {
    return JSON.parse(jsonString);
  }

  return jsonString;
}
