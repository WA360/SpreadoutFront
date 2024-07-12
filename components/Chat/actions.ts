// 'use server';

// import { Readable } from 'stream';

// export async function sendMessage(question: string): Promise<ReadableStream> {
//   const response = await fetch(
//     'https://1b51-118-34-210-22.ngrok-free.app/question/bedrock',
//     {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ question }),
//     }
//   );

//   if (!response.ok) {
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }

//   // 서버의 응답을 ReadableStream으로 변환
//   const stream = new ReadableStream({
//     async start(controller) {
//       const reader = response.body!.getReader();
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         controller.enqueue(value);
//       }
//       controller.close();
//     },
//   });

//   return stream;
// }