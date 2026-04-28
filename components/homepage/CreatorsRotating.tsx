// components/homepage/CreatorsRotating.tsx
'use client'

interface Creator {
    name: string
    img: string
}

interface Props {
    direction: 'left' | 'right'
}

export default function CreatorsRotating({ direction }: Props) {
    const creators: Creator[] = [
        { name: '@influencer1', img: 'https://i.pravatar.cc/150?u=1' },
        { name: '@creator2', img: 'https://i.pravatar.cc/150?u=2' },
        { name: '@star3', img: 'https://i.pravatar.cc/150?u=3' },
        { name: '@icon4', img: 'https://i.pravatar.cc/150?u=4' },
    ]

    const items = [...creators, ...creators]

    return (
        <section className="py-16 bg-gray-50 overflow-hidden group">
            <h2 className="text-center text-2xl font-bold mb-8">Our Creators</h2>

            {/* The moving strip – animation via CSS class, direction via inline style */}
            <div
                className="marquee-strip flex gap-8 w-max group-hover:[animation-play-state:paused]"
                style={{
                    animationDirection: direction === 'left' ? 'normal' : 'reverse',
                }}
            >
                {items.map((c, i) => (
                    <div
                        key={i}
                        className="bg-white p-6 rounded-xl shadow w-48 text-center flex-shrink-0"
                    >
                        <img
                            src={c.img}
                            alt={c.name}
                            className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                        />
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-sm text-gray-500">Influencer</p>
                    </div>
                ))}
            </div>

            <style>{`
        .marquee-strip {
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </section>
    )
}