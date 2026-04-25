export default function LogoStrip() {
    // In production, fetch or hard‑code brand logos
    return (
        <section className="py-10 bg-white">
            <p className="text-center text-sm text-gray-500 mb-6">
                Trusted by leading brands
            </p>
            <div className="flex justify-center gap-12 opacity-50">
                <span className="text-2xl font-bold text-gray-400">Brand A</span>
                <span className="text-2xl font-bold text-gray-400">Brand B</span>
                <span className="text-2xl font-bold text-gray-400">Brand C</span>
            </div>
        </section>
    )
}