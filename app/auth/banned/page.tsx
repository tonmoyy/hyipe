// app/auth/banned/page.tsx
export default function BannedPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center px-4">
            <h1 className="text-3xl font-bold text-red-600">Account Suspended</h1>
            <p className="mt-4 text-lg text-gray-700 max-w-md">
                Your account has been banned. If you believe this is a mistake, please contact the platform administrator.
            </p>
            <p className="mt-2 text-sm text-gray-500">
                You will not be able to access any features until further notice.
            </p>
        </div>
    )
}