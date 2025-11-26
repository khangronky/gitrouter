import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOtpSchema } from '@/lib/schema/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: z.treeifyError(validation.error),
        },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;

    const supabase = await createClient();

    // Verify the OTP
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
