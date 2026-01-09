import ForgotPasswordForm from './form';

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-16">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="font-bold text-5xl">Reset Your Password</h1>
          <p className="text-base text-gray-500">
            Enter your email to receive a password reset code
          </p>
        </div>
        <div className="w-full max-w-md space-y-4">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
