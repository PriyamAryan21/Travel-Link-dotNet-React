export interface AuthResponseDto {
    token: string;
    refreshToken: string;
    name: string;
    email: string;
    userId: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RefreshTokenRequestDto {
    token: string;
    refreshToken: string;
}

export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

