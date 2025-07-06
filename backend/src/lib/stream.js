import { StreamChat } from "stream-chat";

import "dotenv/config";
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if(!apiKey || !apiSecret) console.error("Missing Stream API key or secret");

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUsers([userData]);
        return userData;
    } catch (error) {
        console.log("Error in upserting Stream user", error);
        return null;
    }
};

//todo : do it later
//export const generateStreamToken = (userId) => streamClient.createToken(userId);