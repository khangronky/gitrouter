import { useMutation } from "@tanstack/react-query";

import { fetcher } from "../index";
import { RegisterSchema, RegisterResponseType } from "@/lib/schema/auth";

// Register
export const useRegister = () => {
  return useMutation({
    mutationFn: async (payload: RegisterSchema): Promise<RegisterResponseType> => {
      return fetcher<RegisterResponseType>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
};


// Login