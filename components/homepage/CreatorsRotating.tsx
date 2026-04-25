interface Props {
    direction: 'left' | 'right'
}

export default function CreatorsRotating({ direction }: Props) {
    const creators = ['@influencer1', '@creator2', '@star3', '@icon4']
    return (
        <section className="py-16 bg-gray-50 overflow-hidden">
            <h2 className="text-center text-2xl font-bold mb-8">Our Creators</h2>
            <div className="flex gap-8 animate-marquee">
                {creators.map((c, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow w-48 text-center">
                        <p className="font-semibold">{c}</p>
                        <p className="text-sm text-gray-500">Influencer</p>
                    </div>
                ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
                Rotating {direction}
            </p>
        </section>
    )
}