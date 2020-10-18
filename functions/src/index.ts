import * as firebaseFunctions from 'firebase-functions';
const functions = firebaseFunctions.region('asia-northeast1');
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as admin from 'firebase-admin';
// @ts-ignore
import { config } from '../config';
admin.initializeApp({
  credential: admin.credential.cert(config),
});

// interface IConsecutiveCommitsHistory {
//   startDate: Date,
//   consecutiveDayCount?: number
//   endDate?: Date | null,
// }

export const updateCommitHistory = functions.https.onRequest(async (request, response) => {
 if (request.method === 'GET') {
   const { uid, username} = request.query;
   // if (typeof uid !== 'string') {
   //   return;
   // }
   const firestore = admin.firestore();

   // const userData = (await firestore.collection('users').doc(uid).get()).data();
   const latestCommitHistoryId = ''
   // userData?.latestCommitHistory;
   let latestCommitHistory: FirebaseFirestore.DocumentData = {
     startDate: new Date(),
     consecutiveDayCount: 0,
     endDate: null
   };
   if (latestCommitHistoryId) {
     latestCommitHistory = (await firestore
       .doc(`users/${uid}/commitHistories/${latestCommitHistoryId}`)
       .get()).data() || {
       startDate: new Date(),
       consecutiveDayCount: 0,
       endDate: null
     };
   }

   // TODO: timestamp 타입 핸들링
   // @ts-ignore
   if (latestCommitHistory.startDate._seconds) {
     // @ts-ignore
     latestCommitHistory.startDate = latestCommitHistory.startDate.toDate()
   }
   const githubFirstPage = (await axios.get(`https://github.com/${username || 'dongqui'}`, { responseType: 'text' })).data;
   const $ = cheerio.load(githubFirstPage);
   const targetYears = $(".js-year-link")
     .get()
     .filter(a => Number($(a).text().trim()) >= latestCommitHistory.startDate.getFullYear())
     .map((a) => $(a).attr("href"));
    console.log(targetYears)
   for (const targetYearUrl of targetYears) {
     const yearPage = (await axios.get(`https://github.com/${targetYearUrl}`, {responseType: 'text'})).data;
     const _$ = cheerio.load(yearPage);
     const $days = _$("rect.day");

     const todayDate = new Date();
     const consecutiveStartDateIndex = Math.floor(
       (latestCommitHistory.startDate.getTime() - new Date(`${todayDate.getFullYear()}-01-01`).getTime())
       / (1000 * 60 * 60 * 24));
     const consecutiveEndDateIndex = Math.floor(
       (todayDate.getTime() - new Date(`${todayDate.getFullYear()}-01-01`).getTime())
       / (1000 * 60 * 60 * 24));

     let consecutiveCommitHistory = latestCommitHistory.endDate ? {
       consecutiveDayCount: 0,
     }  : latestCommitHistory;
     const consecutiveCommitHistoryList = [];
     for (let i = consecutiveStartDateIndex; i <= consecutiveEndDateIndex; i++) {
       const commitDate = new Date(_$($days.get(i)).attr('data-date') || '');
       const commitCount = Number(_$($days.get(i)).attr('data-count'));
       if (commitCount === 0 && Number(consecutiveCommitHistory?.consecutiveDayCount) > 0) {
         consecutiveCommitHistory.endDate = commitDate;
         if (consecutiveCommitHistory === latestCommitHistory) {
           await firestore.doc(`users/${uid}/commitHistories/${latestCommitHistoryId}`)
             .set(consecutiveCommitHistory, { merge: true });
         } else {
           consecutiveCommitHistoryList.push(consecutiveCommitHistory);
         }
         consecutiveCommitHistory = {
           consecutiveDayCount: 0,
         }
       } else {
         consecutiveCommitHistory.startDate = consecutiveCommitHistory.startDate || commitDate;
         consecutiveCommitHistory.consecutiveDayCount = (consecutiveCommitHistory.consecutiveDayCount || 0) + 1;
       }
     }
     if (!consecutiveCommitHistory.endDate && consecutiveCommitHistory.consecutiveDayCount) {
       consecutiveCommitHistoryList.push(consecutiveCommitHistory);
     }
     try {
       await Promise.all(consecutiveCommitHistoryList.map(consecutiveCommitData => {
         return firestore.collection(`users/${uid}/commitHistories`).add(consecutiveCommitData);
       }));

       const latestCommits = consecutiveCommitHistoryList[consecutiveCommitHistoryList.length - 1] || latestCommitHistory;
       await firestore.doc(`users/${uid}`).set({ latestCommitHistory: latestCommits }, { merge: true });
       response.send({ consecutiveCommitHistoryList });
     } catch(e) {
        console.log(e)
     }
   }
 }
});
