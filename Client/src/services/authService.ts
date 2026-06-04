import type { AuthResponseDto, LoginDto, RefreshTokenRequestDto, RegisterDto } from "../types";
import api, { unwrap } from "./api";

const authService = {
    login: (dto: LoginDto) => unwrap<AuthResponseDto>(api.post('auth/login', dto)),
    register: (dto: RegisterDto) => unwrap<AuthResponseDto>(api.post('auth/register', dto)),
    refresh: (dto: RefreshTokenRequestDto) => unwrap<AuthResponseDto>(api.post('auth/refresh', dto))
}

export default authService;