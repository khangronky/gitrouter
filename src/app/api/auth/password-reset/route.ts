import { NextResponse } from 'next/server';
import { z } from 'zod';
import { forgotPasswordSchema } from '@/lib/schema/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: z.treeifyError(validation.error),
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const supabase = await createClient();

    // Send password reset OTP email
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Recovery OTP sent successfully!',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
