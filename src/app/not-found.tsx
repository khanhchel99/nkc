import Header from "./_components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* <Header session={null} darkMode={true} /> */}
      <main className="flex flex-1 flex-col items-center justify-center text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-6">Page Not Found</h2>
        <p className="mb-8">Sorry, the page you are looking for does not exist.</p>
        <a href="/" className="bg-white text-black px-6 py-2 rounded font-medium hover:bg-gray-200">Go Home</a>
      </main>
    </div>
  );
}
