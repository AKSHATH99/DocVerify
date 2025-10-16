import { useEffect, useState } from "react";
import { FileText, Hash, FileType, Search } from "lucide-react";

export default function FileHistory() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState(""); // Type / Date / Wallet
    const [sortOrder, setSortOrder] = useState("newest"); // for Date filter
    const [loggedIn, setLoggedIn] = useState(false);
    const [userId, setUserId] = useState(null);

    const fetchFiles = async (userId) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/file/fetchAllFiles?userId=${userId}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to fetch files");

            setFiles(data.files || []);
        } catch (err) {
            console.error("Error fetching files:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const userIdfromlocalstorage = localStorage.getItem("user_id");
        console.log("User ID from localStorage:", userIdfromlocalstorage);
        if (!userIdfromlocalstorage) {
            setLoggedIn(false);
            return;
        } else {
            setLoggedIn(true);
            setUserId(userIdfromlocalstorage);
            fetchFiles(userIdfromlocalstorage);
        }


    }, []);

    useEffect(() => {
        const handler = () => {
            const userId = localStorage.getItem("user_id");
            fetchFiles(userId);
            setLoggedIn(true);
        };

        window.addEventListener("login-success", handler);
        return () => window.removeEventListener("login-success", handler);
    }, []);

    useEffect(() => {
        const handler = () => {
            setFiles([]);
            setLoggedIn(false);
        };

        window.addEventListener("logout-success", handler);
        return () => window.removeEventListener("logout-success", handler);
    }, []);

    useEffect(() => {
        if (loggedIn) {
            const userId = localStorage.getItem("user_id");
            fetchFiles(userId);
        }
    }, [loggedIn]);



    // Filtering and sorting logic
    const filteredFiles = files
        .filter((file) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                file.file_name.toLowerCase().includes(query) ||
                file.file_type.toLowerCase().includes(query) ||
                file.file_hash.toLowerCase().includes(query) ||
                file.wallet_address.toLowerCase().includes(query);

            if (filterType === "Wallet") {
                return file.wallet_address.toLowerCase().includes(query);
            } else if (filterType === "Type") {
                return matchesSearch; // optional: could add exact type dropdown
            }
            return matchesSearch;
        })
        .sort((a, b) => {
            if (filterType === "Date") {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortOrder === "newest"
                    ? dateB - dateA
                    : dateA - dateB;
            }
            return 0;
        });

    if (loading) return <p className="text-gray-400 text-sm animate-pulse">Loading files...</p>;
    if (error) return <p className="text-red-400 text-sm">Error: {error}</p>;
    if (!loggedIn) return <p className="text-gray-500 text-sm">Please sign in to view your files.</p>;
    if (!files.length) return <p className="text-gray-500 text-sm">No files uploaded yet.</p>

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <FileText size={18} className="text-blue-500" />
                <span>Your Files</span>
            </h2>

            {/* Search */}
            <div className="relative my-5 mt-12">
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-gray-700 rounded-md p-2 pl-9 bg-gray-800 text-gray-200 w-full"
                />
                <Search
                    size={18}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                />
            </div>

            {/* Filters */}
            <div className="flex my-4 mb-10 items-center mt-1 text-xs text-gray-500 space-x-2 truncate gap-2">
                filter by:
                {["Type", "Date", "Wallet"].map((type) => (
                    <span
                        key={type}
                        onClick={() => setFilterType(filterType === type ? "" : type)}
                        className={`p-2 rounded-md transition-all duration-300 shadow-sm border border-gray-700 cursor-pointer ${filterType === type ? "bg-blue-600 text-white" : "bg-gray-800/60 hover:bg-gray-800"
                            }`}
                    >
                        {type}
                    </span>
                ))}

                {/* Sort Order toggle only visible for Date filter */}
                {filterType === "Date" && (
                    <span
                        onClick={() =>
                            setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                        }
                        className="p-2 rounded-md transition-all duration-300 shadow-sm border border-gray-700 cursor-pointer bg-gray-800/60 hover:bg-gray-800"
                    >
                        {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                    </span>
                )}
            </div>

            {/* File List */}
            <ul className="space-y-4 gap-4 max-h-[500px] overflow-y-auto overflow-x-hidden p-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {filteredFiles.map((file) => (
                    <li
                        key={file.id}
                        className="bg-gray-800/60 hover:bg-gray-800 rounded-xl p-3 transition-all duration-300 shadow-sm border border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                                <FileType size={16} className="text-blue-400 shrink-0" />
                                <p className="font-medium text-gray-200 truncate max-w-[180px]">
                                    {file.file_name}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500 flex-shrink-0">{file.file_type}</p>
                        </div>

                        <div className="flex items-center mt-2 text-sm text-gray-400 space-x-2">
                            <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        </div>

                        <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2 truncate min-w-0">
                            <Hash size={14} className="text-purple-400 shrink-0" />
                            <span className="truncate block">{file.file_hash}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
