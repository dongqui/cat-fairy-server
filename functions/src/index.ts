import * as firebaseFunctions from 'firebase-functions';
const functions = firebaseFunctions.region('asia-northeast1');
import * as cheerio from "cheerio";
import axios from 'axios';

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

export const githubInfo = functions.https.onRequest(async (request, response) => {
 if (request.method === 'GET') {
   const startDate = new Date('2020-05-06');
   const { username } = request.query;
   const githubFirstPage = (await axios.get(`https://github.com/${username}`, { responseType: 'text' })).data;
   const $ = cheerio.load(githubFirstPage);
   const targetYears = $(".js-year-link")
     .get()
     .map((a: string) => {
       const $a = $(a);
       return {
         href: $a.attr("href"),
         text: $a.text().trim()
       };
     })
     .filter(a => Number(a.text) >= startDate.getFullYear());

   for (const year of targetYears) {
     const yearPage = (await axios.get(`https://github.com/${year.href}`, { responseType: 'text' })).data;
     const $ = cheerio.load(yearPage);
     const $days = $("rect.day");
     const dateData = {
       start: $($days.get(0)).attr("data-date"),
       end: $($days.get($days.length - 1)).attr("data-date")
     }
     console.log(dateData)
   }
  }
})
