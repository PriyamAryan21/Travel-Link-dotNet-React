import type { FriendDto, FriendRequestDto, SendFriendRequestDto } from "../types";
import api, { unwrap } from "./api";

const friendService = {
    sendRequest: (dto: SendFriendRequestDto) =>
        unwrap<string>(api.post(`friend/send`, dto)),

    repondToRequest: (requestId: string, action: 'accept' | 'reject') =>
        unwrap<string>(api.post(`friend/respond/${requestId}?action=${action}`)),

    getPendingRequests: () =>
        unwrap<FriendRequestDto[]>(api.get(`friend/pending`)),

    getFriends: () =>
        unwrap<FriendDto[]>(api.get(`friend/list`)),

    unfriend: (targetUserId: string) =>
        unwrap<string>(api.delete(`friend/unfriend/${targetUserId}`))
};

export default friendService;