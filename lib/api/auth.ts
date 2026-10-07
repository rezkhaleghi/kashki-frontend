import { apiClient } from "@/lib/api/client";
import type { ApiMessage, User } from "@/lib/types";

export type RequestOtpInput = { email: string };
export type SignUpInput = {
  userName: string;
  email: string;
  password: string;
  otp: string;
};
export type LoginPasswordInput = { email: string; password: string };
export type LoginOtpInput = { email: string; otp: string };
export type ChangePasswordInput = { password: string };

export async function requestOtp(input: RequestOtpInput) {
  return apiClient<ApiMessage>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email: input.email }),
  });
}

export async function signUp(input: SignUpInput) {
  return apiClient<ApiMessage>("/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginPassword(input: LoginPasswordInput) {
  return apiClient<ApiMessage>("/auth/simple-login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginOtp(input: LoginOtpInput) {
  return apiClient<ApiMessage>("/auth/login-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout() {
  return apiClient<ApiMessage>("/auth/logout", {
    method: "POST",
  });
}

export async function changePassword(input: ChangePasswordInput) {
  return apiClient<ApiMessage>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentUser() {
  return apiClient<User>("/users/me");
}
