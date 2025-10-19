import { useEffect, useState } from "react";
import { Copy, FileText, Hash, FileType, Search, Calendar, Wallet, X, Filter } from "lucide-react";

export default function FileHistory() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState(""); // Type / Date / Wallet
    const [sortOrder, setSortOrder] = useState("newest"); // for Date filter
    const [selectedFileType, setSelectedFileType] = useState(""); // specific file type filter
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
            const userId = localStorage.getItem("user_id");
            fetchFiles(userId);
        };
        window.addEventListener("file-uploaded", handler);
        return () => window.removeEventListener("file-uploaded", handler);
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

    // Get unique file types for filter dropdown
    const uniqueFileTypes = [...new Set(files.map(file => file.file_type))].sort();

    // Enhanced filtering and sorting logic
    const filteredFiles = files
        .filter((file) => {
            const query = searchQuery.toLowerCase();

            // Base search matching across all fields
            const matchesSearch =
                file.file_name.toLowerCase().includes(query) ||
                file.file_type.toLowerCase().includes(query) ||
                file.file_hash.toLowerCase().includes(query) ||
                file.wallet_address.toLowerCase().includes(query);

            // Apply specific filter type
            if (filterType === "Wallet") {
                return file.wallet_address.toLowerCase().includes(query);
            } else if (filterType === "Type") {
                const matchesType = selectedFileType ? file.file_type === selectedFileType : true;
                return matchesType && (query ? file.file_name.toLowerCase().includes(query) : true);
            } else if (filterType === "Date") {
                return matchesSearch;
            }

            return matchesSearch;
        })
        .sort((a, b) => {
            if (filterType === "Date" || sortOrder !== "newest") {
                const dateA = new Date(a.created_at);
                const dateB = new Date(b.created_at);
                return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
            }
            return 0;
        });

    const clearAllFilters = () => {
        setFilterType("");
        setSearchQuery("");
        setSelectedFileType("");
        setSortOrder("newest");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateHash = (hash, length = 12) => {
        return hash.length > length ? `${hash.slice(0, length)}...${hash.slice(-4)}` : hash;
    };

    const truncateAddress = (address, length = 8) => {
        return address.length > length ? `${address.slice(0, length)}...${address.slice(-6)}` : address;
    };

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-400 text-sm">Loading files...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">Error: {error}</p>
        </div>
    );

    if (!loggedIn) return (
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-8 text-center">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Please sign in to view your files.</p>
        </div>
    );

    return (
<div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg">
                        <FileText size={24} className="text-blue-500 dark:text-blue-500" />
                    </div>
                    <span className="text-black dark:text-white bg-clip-text dark:text-transparent">
                        Your Files
                    </span>
                </h2>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by name, type, hash, or wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 pl-10 pr-10 bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Filter size={16} />
                        <span>Filter By </span>
                    </div>
                    {(filterType || searchQuery || selectedFileType) && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                            <X size={14} />
                            <span>Clear all</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {["Type", "Date", "Wallet"].map((type) => (
                        <button
                            key={type}
                            onClick={() => {
                                setFilterType(filterType === type ? "" : type);
                                if (type !== "Type") setSelectedFileType("");
                            }}
                            className={`px-2 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${filterType === type
                                ? "bg-blue-600 dark:bg-blue-600 text-white dark:text-white shadow-lg"
                                : "bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-400 dark:border-gray-600"
                                }`}
                        >
                            {type === "Type" && <FileType size={16} />}
                            {type === "Date" && <Calendar size={16} />}
                            {type === "Wallet" && <Wallet size={16} />}
                            <span>{type}</span>
                        </button>
                    ))}

                    {filterType === "Type" && (
                        <select
                            value={selectedFileType}
                            onChange={(e) => setSelectedFileType(e.target.value)}
                            className="px-4 py-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-blue-500/50 dark:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All types</option>
                            {uniqueFileTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    )}

                    {filterType === "Date" && (
                        <button
                            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 border border-blue-500/50 dark:border-blue-500/50 flex items-center space-x-2"
                        >
                            <Calendar size={16} />
                            <span>{sortOrder === "newest" ? "↓ Newest" : "↑ Oldest"}</span>
                        </button>
                    )}
                </div>


            </div>

            {filteredFiles.length !== files.length && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredFiles.length} of {files.length} files
                </div>
            )}

            {!files.length ? (
                <div className="bg-gray-100 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                    <FileText size={48} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No files uploaded yet.</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="bg-gray-100 dark:bg-gray-800/40 border border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                    <Search size={48} className="text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No files match your search criteria.</p>
                    <button
                        onClick={clearAllFilters}
                        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-200 dark:scrollbar-track-gray-900">
                    {filteredFiles.map((file) => (
                        <div
                            key={file.id}
                            className="group bg-gradient-to-br from-white/90 to-white/70 dark:from-black/20 dark:to-black/40 hover:from-white dark:hover:from-black/90 hover:to-white dark:hover:to-black/70 rounded-xl p-4 transition-all duration-300 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-blue-500/5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="p-2 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/20 transition-colors">
                                        <FileType size={20} className="" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                                            {file.file_name}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700/50 rounded-md text-gray-600 dark:text-gray-400">
                                                {file.file_type}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                                {(file.file_size / 1024).toFixed(2)} KB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 p-2  mb-2">
                                <Calendar size={14} className=" shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-gray-700 dark:text-gray-300 text-xs truncate">
                                        {formatDate(file.created_at)}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800/50">
                                    <div className="flex items-center space-x-2 min-w-0">
                                        <Hash size={14} className="shrink-0" />
                                        <span className="text-gray-600 dark:text-gray-400 text-xs">Hash:</span>
                                        <code className="text-xs truncate flex-1 font-mono text-gray-800 dark:text-gray-300">
                                            {truncateHash(file.file_hash)}
                                        </code>
                                    </div>

                                    {/* Copy Button */}
                                    <button
                                        onClick={() => navigator.clipboard.writeText(file.file_hash)}
                                        className="ml-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition-colors"
                                        title="Copy hash"
                                    >
                                        <Copy className="" size={16} />
                                    </button>
                                </div>

                                <div className="grid my-5 gap-2">
                                    <div className="flex items-center space-x-2 p-3 text-[#6f5aea] dark:text-[#6f5aea] rounded-lg border border-[#6f5aea]/30 dark:border-[#6f5aea]/30 bg-[#6f5aea]/10 dark:bg-[#6f5aea]/10">
                                        <Wallet size={14} className="shrink-0" />
                                        <div className="min-w-0">
                                            <div className="  ">Wallet</div>
                                            <code className=" text-xs  block font-mono">
                                                {truncateAddress(file.wallet_address)}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}