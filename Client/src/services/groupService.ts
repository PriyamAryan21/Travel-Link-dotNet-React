import type { CreateGroupDto, GroupDto } from "../types";
import api, { unwrap } from "./api";

const groupService = {
    create: (dto: CreateGroupDto) =>
        unwrap<GroupDto>(api.post('group/create', dto)),

    getMyGroups: () =>
        unwrap<GroupDto[]>(api.get('group/my')),

    getById: (id: string) =>
        unwrap<GroupDto>(api.get(`group/${id}`)),

    addMember: (groupId: string, memberId: string) =>
        unwrap<GroupDto>(api.post(`group/${groupId}/add-member`, JSON.stringify(memberId), {
            headers: {
                'Content-Type': 'application/json'
            }
        })),

    leave: (groupId: string) =>
        unwrap<string>(api.delete(`group/${groupId}/leave`)),

    removeMember: (groupId: string, targetUserId: string) =>
        unwrap<string>(api.delete(`group/${groupId}/remove-member`, {
            data: JSON.stringify(targetUserId),
            headers: {
                'Content-Type': 'application/json'
            }
        })),

    uploadCover: (groupId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ coverImageUrl: string }>(`group/${groupId}/cover`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(res => res.data);
    }
};

export default groupService;
