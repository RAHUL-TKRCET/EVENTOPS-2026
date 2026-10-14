import { User } from "@/types";
import { apiRequest } from "./config";

export interface ProfileUpdateInput {
  name: string;
  email: string;
  phone?: string;
}

export const profileApi = {
  async update(input: ProfileUpdateInput): Promise<User> {
    return apiRequest<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
      }),
    });
  },
};
