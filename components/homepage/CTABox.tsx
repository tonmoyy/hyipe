import Link from 'next/link'

export default function CTABox() {
    return (
        <section className="py-16 bg-black text-white text-center">
            <h2 className="text-3xl font-bold">Ready to grow your brand?</h2>
            <p className="mt-3 text-gray-300">
                Join HYIPE and connect with Pakistan’s best creators.
            </p>
            <Link
                href="/auth"
                className="mt-6 inline-block bg-white text-black px-8 py-3 rounded-full font-semibold"
            >
                Sign Up Now
            </Link>
        </section>
    )
}