import * as firebaseFunctions from 'firebase-functions';
const functions = firebaseFunctions.region('asia-northeast1');
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as admin from 'firebase-admin';
// TODO: check what confg is - admin.initializeApp(functions.config().firebase);
admin.initializeApp();

export const helloWorld = functions.https.onRequest(async (request, response) => {
 const test = await admin.firestore().collection('test').add({ test: 'hello world'});
 const data = (await test.get()).data();
 response.send(data);
});

export const githubInfo = functions.https.onRequest(async (request, response) => {
 if (request.method === 'GET') {
   const firestore = await admin.firestore();

   interface IConsecutiveCommitsData {
     startDate: Date,
     consecutiveDayCount?: number
     endDate?: Date | null,
   }

   const user = (await firestore.collection('users').doc('uid').get()).data();
   const username = user?.username;

   const latestCommitData: IConsecutiveCommitsData = user?.latestCommitData || {
     startDate: new Date(),
     consecutiveDayCount: 0,
     endDate: null
   };

   const githubFirstPage = (await axios.get(`https://github.com/${username}`, { responseType: 'text' })).data;
   const $ = cheerio.load(githubFirstPage);
   const targetYears = $(".js-year-link")
     .get()
     .filter(a => Number($(a).text().trim()) >= latestCommitData.startDate.getFullYear())
     .map((a) => $(a).attr("href"));

   for (const year of targetYears) {
     const yearPage = (await axios.get(`https://github.com/${year}`, {responseType: 'text'})).data;
     const $ = cheerio.load(yearPage);
     const $days = $("rect.day");

     let consecutiveCommitsData: IConsecutiveCommitsData = latestCommitData;

     const todayDate = new Date();
     const consecutiveStartDateIndex = Math.floor(
       (consecutiveCommitsData.startDate.getTime() - new Date(`${todayDate.getFullYear()}-01-01`).getTime())
       / (1000 * 60 * 60 * 24));
     const consecutiveEndDateIndex = Math.floor(
       (todayDate.getTime() - new Date(`${todayDate.getFullYear()}-01-01`).getTime())
       / (1000 * 60 * 60 * 24));

     const consecutiveCommitsDataList: IConsecutiveCommitsData[] = [];
     for (let i = consecutiveStartDateIndex; i <= consecutiveEndDateIndex; i++) {
       const commitDate = new Date($($days.get(i)).attr('data-date') || '');
       const commitCount = Number($($days.get(i)).attr('data-count'));
       if (commitCount === 0 && Number(consecutiveCommitsData.consecutiveDayCount) > 0) {
         consecutiveCommitsDataList.push(consecutiveCommitsData);
       } else {
         consecutiveCommitsData.startDate = consecutiveCommitsData.startDate || commitDate;
         consecutiveCommitsData.consecutiveDayCount = (consecutiveCommitsData.consecutiveDayCount || 0) + 1;
         consecutiveCommitsData.endDate = commitDate;
       }
     }

     response.send({ consecutiveCommitsDataList });
   }
 }
});
