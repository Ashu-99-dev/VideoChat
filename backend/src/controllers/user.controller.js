import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";


export async function getRecommendedUsers(req, res) {
    try {
        const currentUserId = req.user._id;
        const currentUser = req.user;
        const recommendedUsers = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Exclude current user
                {
                    _id: { $nin: currentUser.friends } // Exclude current user's friends
                },
                { isOnboarded: true } // Only include users who have completed onboarding
            ]
        })
        res.status(200).json(recommendedUsers);
    } catch (error) {
        console.log("Error in getRecommendedUsers controller", error.message);
        return res.status(500).json({ message: "Something went wrong" });

    }
}


export async function getMyFriends(req, res) {
    try {
        const user = await User.findById(req.user._id)
            .populate("friends", "fullName profilePicture nativeLanguage learningLanguage ")

        res.status(200).json({
            success: true,
            friends: user.friends
        });

    } catch (error) {
        console.log("Error in getMyFriends controller", error.message);
        return res.status(500).json({ message: "Something went wrong" });

    }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user.id;
        const { id: recipientId } = req.params;

        // prevent sending friend request to self
        if (myId === recipientId) {
            return res.status(400).json({ message: "You cannot send a friend request to yourself" });
        }
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(400).json({ message: "User not found" });
        }
        if (recipient.friends.includes(myId)) {
            return res.status(400).json({ message: "You are already friends with this user" });
        }

        // check if friend request already exists
        const existingRequest = await FriendRequest.findOne({
            $or:
                [{ sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId },
                ],
        });
        if (existingRequest) {
            return res.
                status(400).
                json({ message: "Friend request already sent" });
        }
        // create friend request
        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId
        });
        res.status(200).json(friendRequest);

    } catch (error) {
        console.log("Error in sendFriendRequest controller", error.message);
        return res.status(500).json({ message: "Something went wrong" });
    }

}

export async function acceptFriendRequest(req, res) {
    try {
        const { id: requestId } = req.params;
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(400).json({ message: "Friend request not found" });
        }
        if (friendRequest.recipient.toString() !== req.user.id) {
            return res.status(401).json({ message: "You are not authorized to accept this friend request" });
        }
        if (friendRequest.status === "accepted") {
            return res.status(400).json({ message: "Friend request already accepted" });
        }
        friendRequest.status = "accepted";
        await friendRequest.save();
        //add each user to the other user's friend list
        // $addToSet: add elements to an array only if they are not already in the array
        await User.findByIdAndUpdate(friendRequest.sender,
            { $addToSet: { friends: friendRequest.recipient } });

        await User.findByIdAndUpdate(friendRequest.recipient,
            { $addToSet: { friends: friendRequest.sender } });

        res.status(200).json(friendRequest);
    } catch (error) {
        console.log("Error in acceptFriendRequest controller", error.message);
        return res.status(500).json({ message: "Something went wrong" });

    }


}


export async function getFriendRequests(req, res) {
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending",
        }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

        const acceptedReqs = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient", "fullName profilePic");

        res.status(200).json({ incomingReqs, acceptedReqs });
    } catch (error) {
        console.log("Error in getPendingFriendRequests controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getOutgoingFriendReqs(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePiC nativeLanguage learningLanguage");

        res.status(200).json(outgoingRequests);
    } catch (error) {
        console.log("Error in getOutgoingFriendRequests controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

