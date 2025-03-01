export default function Header() {
  return (
    <footer className="bg-zinc-900 border-t border-gray-800 pb-12">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <div className="flex flex-col sm:flex-row mt-6 items-center space-x-0 sm:space-x-6 w-full justify-between sm:space-y-0 space-y-4">
          <a href="/">
            <h1 className="text-4xl font-bold bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
              SafeCall
            </h1>
          </a>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-md transition-all transform hover:scale-110 active:scale-95 active:opacity-80 flex items-center gap-2 text-sm font-semibold w-full sm:w-auto"
            >
              Home
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-md transition-all transform hover:scale-110 active:scale-95 active:opacity-80 flex items-center gap-2 text-sm font-semibold w-full sm:w-auto"
            >
              Dashboard
            </button>
            <button className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:bg-red-600 text-white px-4 py-2.5 rounded-md transition-all transform hover:scale-110 active:scale-95 active:opacity-80 flex items-center gap-2 text-sm font-semibold w-full sm:w-auto">
              Call
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
