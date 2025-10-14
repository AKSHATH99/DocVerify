import { useEffect, useState } from "react";

export default function UserFiles() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;

        const fetchFiles = async () => {
            console.log("Fetching files for user:", userId);
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`/api/file/fetchAllFiles?userId=${userId}`, {
                // const response = await fetch(`/api/file/fetchAllFiles?userId=9d0b07a8-98a2-4bc7-9fd9-91d148d8f3c7`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                const data = await response.json();
                console.log("Fetched files:", data);

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch files");
                }

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

    useEffect(() => {
        // console.log("Files state updated:", userId);
    }, []);

    if (loading) return <p>Loading files...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!files.length) return <p>No files found.</p>;

    return (
        <div>
            <h2>User Files</h2>
            <ul>
                {files.map((file) => (
                    <li key={file.id}>
                        <p><strong>Name:</strong> {file.file_name}</p>
                        <p><strong>Type:</strong> {file.file_type}</p>
                        <p><strong>Size:</strong> {(file.file_size / 1024).toFixed(2)} KB</p>
                        <p><strong>Hash:</strong> {file.file_hash}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
