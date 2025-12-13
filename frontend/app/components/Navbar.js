import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-gray-900 p-4 text-white flex justify-between items-center">
            <Link href="/" className="hover:text-gray-300">
                <h1 className="text-xl font-bold">My Application</h1>
            </Link>
            <div>
                <Link href="/login" className="mr-4 hover:text-gray-300">Login</Link>
            </div>
        </nav>
    )
}
