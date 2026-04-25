// app/auth/verified/page.tsx
export default function VerifiedPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center px-4">
            <h1 className="text-3xl font-bold text-green-600">✅ Email Verified!</h1>
            <p className="mt-3 text-lg text-gray-700">
                Welcome to HYIPE. You can now log in.
            </p>
            <a
                href="/auth"
                className="mt-6 inline-block bg-black text-white px-6 py-2 rounded font-medium"
            >
                Go to Login
            </a>
        </div>
    )
}