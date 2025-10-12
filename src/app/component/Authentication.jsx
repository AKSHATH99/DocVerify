import { useState } from "react";

export default function Authentication({ onClose }) {
    const [authMethod, setAuthMethod] = useState("login");

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-gray-100 w-full max-w-md rounded-2xl shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-semibold text-gray-800">Authentication</h1>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Switch buttons */}
                <div className="flex mb-6 border-b border-gray-300">
                    <button
                        onClick={() => setAuthMethod("login")}
                        className={`flex-1 py-2 text-center font-medium ${authMethod === "login"
                                ? "text-black border-b-2 border-black"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setAuthMethod("signup")}
                        className={`flex-1 py-2 text-center font-medium ${authMethod === "signup"
                                ? "text-black border-b-2 border-black"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                {authMethod === "login" ? (
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                        >
                            Login
                        </button>
                    </form>
                ) : (
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                        >
                            Sign Up
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
