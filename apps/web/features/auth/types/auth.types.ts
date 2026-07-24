// export interface LoginRequest {
//   email: string;
//   password: string;
// }

// export interface RegisterRequest {
//   email: string;
//   password: string;
// }

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// export interface ForgotPasswordRequest {
//   email: string;
// }

// export interface ResetPasswordRequest {
//   token: string;
//   password: string;
// }

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}
