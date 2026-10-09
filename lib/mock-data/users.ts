import { User } from "@/types";
import { createFallbackArray, defaultUser } from "./fallbacks";

export const mockUsers: User[] = createFallbackArray<User>([], defaultUser);
