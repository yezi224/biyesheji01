import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

export async function consultSportsExpert(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro'});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error('Error consulting sports expert:', error);
    return 'Error: Unable to consult sports expert at this time.';
  }
}
