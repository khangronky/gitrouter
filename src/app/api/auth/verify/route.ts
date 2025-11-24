import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Validation schema matching client-side validation
const registerSchema = z.object({
  email: z.email('Invalid email address'),
  otp: z.number().min(6, 'OTP must be at least 6 digits'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);

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
      token: otp.toString(),
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
