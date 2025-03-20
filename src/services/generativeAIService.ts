import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pLimit from "p-limit";

dotenv.config();

const AI_API_KEY = process.env.AI_API_KEY;
const genAI = new GoogleGenerativeAI(AI_API_KEY!);

const requestLimit = pLimit(3); // maximum 3 requests at a time

export interface Player {
  _id?: string;
  username: string;
  skillLevel?: string;
}

function extractJson(text: string): string {
  try {
    let cleanText = text.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    return cleanText;
  } catch (error) {
    console.error("Error cleaning response text:", error);
    throw new Error("Failed to clean response");
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function splitUsersIntoBalancedTeams(
  players: Player[],
  retryCount = 2, 
  delayMs = 500 // 500ms delay before retry Attempts
): Promise<{ teamA: Player[]; teamB: Player[] } | null> {
  return requestLimit(async () => {
    try {
        const model = genAI.getGenerativeModel({model: 'gemini-1.5-flash'});

      const prompt = `You are an expert in team balancing. Given the following players with skill levels, split them into two balanced teams. 
      Ensure the response is a valid JSON object ONLY, no markdown, no extra text. Output format: { "teamA": [players], "teamB": [players] }.
      Players: ${JSON.stringify(players, null, 2)}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      console.log("Raw Response:", rawText);

      const cleanText = extractJson(rawText);
      const output = JSON.parse(cleanText);

      // Validate response structure
      if (!output.teamA || !output.teamB || !Array.isArray(output.teamA) || !Array.isArray(output.teamB)) {
        throw new Error("Invalid response structure");
      }

      return { teamA: output.teamA, teamB: output.teamB };
    } catch (error: any) {
      console.error("Error in API call:", error.message);

      // Retry if rate limited (status code 429) or unknown error
      if (error.response?.status === 429) {
        console.warn("Rate limit exceeded! Retrying after delay...");
        await delay(5000); // המתנה של 5 שניות
        return splitUsersIntoBalancedTeams(players, retryCount, delayMs);
      }

      if (retryCount > 0) {
        console.warn(`Retrying... Attempts left: ${retryCount}`);
        await delay(delayMs); 
        return splitUsersIntoBalancedTeams(players, retryCount - 1, delayMs);
      }

      return null;
    }
  });
}
