import { z } from "zod";

const password = z.string().regex(
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,20}$/,
  "Password must be 4-20 characters long and contain at least one letter and one number."
);

export const userSignupSchema = z.object({
  email: z.string().email(),
  password: password,
  role:z.enum(["user","admin"]).default('user')
});
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})
export type UserLogin = z.infer<typeof userLoginSchema>;

export type UserSignup = z.infer<typeof userSignupSchema>;