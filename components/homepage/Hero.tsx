import Link from 'next/link'

export default function Hero() {
    return (
        <section className="py-20 text-center bg-gray-50">
            <h1 className="text-5xl font-extrabold tracking-tight">
                Find the perfect influencer for your brand
            </h1>
            <p className="mt-4 text-xl text-gray-600">
                HYIPE connects brands with authentic creators in Pakistan.
            </p>
            <Link
                href="/auth"
                className="mt-8 inline-block bg-black text-white px-8 py-3 rounded-full font-semibold"
            >
                Get Started
            </Link>
        </section>
    )
}