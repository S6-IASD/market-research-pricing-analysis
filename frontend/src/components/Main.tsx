
import SearchBar from "./SearchBar"

export default function Main() {
    return (
        <main className="max-w-7xl mx-auto px-3 pt-2 lg:p-8 sm:px-4 lg:px-8" >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 " >
                <SearchBar />
                <></>
            </div>
        </main>
    )
}