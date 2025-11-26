import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Validation schema matching client-side validation
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: z.treeifyError(validation.error),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Sign in user with Supabase auth
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Create response with user data
    const response = NextResponse.json(
      {
        message: "Login successful!",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    );

    // Set access token as httpOnly cookie
    response.cookies.set("access_token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    // Set refresh token as httpOnly cookie
    response.cookies.set("refresh_token", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
