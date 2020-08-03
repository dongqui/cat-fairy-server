import * as firebaseFunctions from 'firebase-functions';
const functions = firebaseFunctions.region('asia-northeast1');
import * as cheerio from "cheerio";
import axios from 'axios';

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

export const githubInfo = functions.https.onRequest(async (request, response) => {
 if (request.method === 'GET') {
  const { username } = request.query;
  const data = (await axios.get(`https://github.com/${username}`, { responseType: 'text' })).data;
  const $ = cheerio.load(data);
  const years = $(".js-year-link")
    .get()
    .map((a: string) => {
     const $a = $(a);
     return {
      href: $a.attr("href"),
      text: $a.text().trim()
     };
    });
  console.log(years);
 }
})
