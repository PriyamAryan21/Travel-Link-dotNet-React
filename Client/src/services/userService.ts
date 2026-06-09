import type { UserProfileDto, UserProfileDetailDto } from "../types"
import api, { unwrap } from "./api"

const userService = {
    getProfile: () =>
        unwrap<UserProfileDto>(api.get('user/profile')),
    
    getProfileDetail: (targetUserId?: string) => {
        const url = targetUserId ? `user/profile/detail/${targetUserId}` : 'user/profile/detail';
        return unwrap<UserProfileDetailDto>(api.get(url));
    },

    searchUsers: (query: string) =>
        unwrap<UserProfileDto[]>(api.get(`user/search?q=${encodeURIComponent(query)}`)),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post<{ imageUrl: string }>(`user/avatar`, formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        ).then(res => res.data)
    }
}

export default userService;