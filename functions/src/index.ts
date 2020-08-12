import * as firebaseFunctions from 'firebase-functions';
const functions = firebaseFunctions.region('asia-northeast1');
import * as cheerio from "cheerio";
import axios from 'axios';

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

export const githubInfo = functions.https.onRequest(async (request, response) => {
 if (request.method === 'GET') {
   const latestVisitDate = new Date('2020-08-01'); //

   const username = 'dongqui'
   const githubFirstPage = (await axios.get(`https://github.com/${username}`, { responseType: 'text' })).data;
   const $ = cheerio.load(githubFirstPage);
   const targetYears = $(".js-year-link")
     .get()
     .filter(a => Number($(a).text().trim()) >= latestVisitDate.getFullYear())
     .map((a) => $(a).attr("href"));

   for (const year of targetYears) {
     const yearPage = (await axios.get(`https://github.com/${year}`, {responseType: 'text'})).data;
     const $ = cheerio.load(yearPage);
     const $days = $("rect.day");

     interface IConsecutiveCommitsData {
       startDate?: Date | null,
       consecutiveDayCount?: number
       endDate?: Date | null,
     }

     let consecutiveCommitsData: IConsecutiveCommitsData = {
       startDate: latestVisitDate || null,
       consecutiveDayCount: 0,
       endDate: null,
     }
     const todayDate = new Date();
     const consecutiveStartDateIndex = Math.floor(
       (latestVisitDate.getTime() - new Date(`${todayDate.getFullYear()}-01-01`).getTime())
       / (1000 * 60 * 60 * 24));
     const consecutiveEndDateIndex = Math.floor(
       (todayDate.getTime() - new Date(`${todayDate.getFullYear()}-01-01`).getTime())
       / (1000 * 60 * 60 * 24));

     const consecutiveCommitsDataList: IConsecutiveCommitsData[] = [];
     for (let i = consecutiveStartDateIndex; i <= consecutiveEndDateIndex; i++) {
       const commitDate = new Date($($days.get(i)).attr('data-date') || '');
       const commitCount = Number($($days.get(i)).attr('data-count'));
       if (commitCount === 0) {
         if (Number(consecutiveCommitsData.consecutiveDayCount) > 0) {
           consecutiveCommitsDataList.push(consecutiveCommitsData);
         }
         consecutiveCommitsData = {
           startDate: null,
           consecutiveDayCount: 0,
           endDate: null
         };
       } else {
         consecutiveCommitsData.startDate = consecutiveCommitsData.startDate || commitDate;
         consecutiveCommitsData.consecutiveDayCount = (consecutiveCommitsData.consecutiveDayCount || 0) + 1;
         consecutiveCommitsData.endDate = commitDate;
       }
     }
   }
 }
});
