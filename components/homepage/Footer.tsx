export default function Footer() {
    return (
        <footer className="py-8 border-t text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} HYIPE. All rights reserved.</p>
            <p className="mt-1">
                Built with ❤️ in Pakistan. Proudly bootstrapped.
            </p>
        </footer>
    )
}