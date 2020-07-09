import * as firebaseFunctions from 'firebase-functions';
const functions = firebaseFunctions.region('asia-northeast1');

export const helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});
