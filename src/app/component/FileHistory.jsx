import { useEffect, useState } from "react";
import { FileText, Hash, HardDrive, FileType } from "lucide-react";

export default function FileHistory() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        const fetchFiles = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`/api/file/fetchAllFiles?userId=${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

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

        fetchFiles();
    }, []);

    if (loading)
        return <p className="text-gray-400 text-sm animate-pulse">Loading files...</p>;
    if (error) return <p className="text-red-400 text-sm">Error: {error}</p>;
    if (!files.length)
        return <p className="text-gray-500 text-sm">No files uploaded yet.</p>;

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <FileText size={18} className="text-blue-500" />
                <span>Your  Files</span>
            </h2>

            <ul className="space-y-4">
                {files.map((file) => (
                    <li
                        key={file.id}
                        className="bg-gray-800/60 hover:bg-gray-800 rounded-xl p-3 transition-all duration-300 shadow-sm border border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <FileType size={16} className="text-blue-400" />
                                <p className="font-medium text-gray-200 truncate max-w-[180px]">
                                    {file.file_name}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500">{file.file_type}</p>
                        </div>

                        <div className="flex items-center mt-2 text-sm text-gray-400 space-x-2">
                            <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        </div>

                        <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2 truncate">
                            <Hash size={14} className="text-purple-400" />
                            <span className="truncate">{file.file_hash}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
