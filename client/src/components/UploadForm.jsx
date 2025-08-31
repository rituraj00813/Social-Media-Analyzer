import { useState, useEffect } from "react";
import axios from "axios";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("text");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError("");
      setAnalysis(null);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    const droppedFile = droppedFiles[0];
    if (
      droppedFile.type === "application/pdf" ||
      droppedFile.type.startsWith("image/")
    ) {
      setFile(droppedFile);
      setResult(null);
      setError("");
      setAnalysis(null);
    } else {
      setError("Only PDF or image files are allowed");
    }
  };

  const analyzeText = (text) => {
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const sentenceCount = text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0).length;
    const avgWordLength = text.replace(/\s+/g, "").length / wordCount;
    const readingTime = Math.ceil(wordCount / 200);

    const syllableCount = text
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .replace(/[aeiou]/g, "").length;
    const readabilityScore = Math.max(
      0,
      Math.min(
        100,
        206.835 -
          1.015 * (wordCount / sentenceCount) -
          84.6 * (syllableCount / wordCount)
      )
    );

    const hasQuestions = /\?/.test(text);
    const hasNumbers = /\d/.test(text);
    const hasBulletPoints = /[•\-\*]\s/.test(text);
    const paragraphCount = text
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0).length;

    const suggestions = [];
    if (sentenceCount > 0 && wordCount / sentenceCount > 20) {
      suggestions.push({
        type: "warning",
        text: "Consider breaking down long sentences for better readability",
      });
    }
    if (!hasQuestions && wordCount > 100) {
      suggestions.push({
        type: "tip",
        text: "Add questions to engage readers and encourage interaction",
      });
    }
    if (!hasNumbers && wordCount > 200) {
      suggestions.push({
        type: "tip",
        text: "Include statistics or numbers to add credibility",
      });
    }
    if (paragraphCount < 3 && wordCount > 150) {
      suggestions.push({
        type: "warning",
        text: "Break content into more paragraphs for better visual flow",
      });
    }
    if (readabilityScore < 30) {
      suggestions.push({
        type: "error",
        text: "Text complexity is very high - simplify for wider audience reach",
      });
    } else if (readabilityScore < 60) {
      suggestions.push({
        type: "warning",
        text: "Consider simplifying language for broader appeal",
      });
    } else {
      suggestions.push({
        type: "success",
        text: "Good readability score - accessible to most readers",
      });
    }
    if (!hasBulletPoints && wordCount > 300) {
      suggestions.push({
        type: "tip",
        text: "Use bullet points or lists to highlight key information",
      });
    }

    let engagementScore = 50;
    if (hasQuestions) engagementScore += 10;
    if (hasNumbers) engagementScore += 10;
    if (hasBulletPoints) engagementScore += 5;
    if (readabilityScore > 60) engagementScore += 15;
    if (paragraphCount >= 3) engagementScore += 10;
    engagementScore = Math.min(100, engagementScore);

    setAnalysis({
      wordCount,
      sentenceCount,
      avgWordLength: avgWordLength.toFixed(1),
      readingTime,
      readabilityScore: Math.round(readabilityScore),
      engagementScore,
      suggestions,
      paragraphCount,
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
      if (res.data && res.data.text) {
        analyzeText(res.data.text);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getSuggestionIcon = (type) => {
    const icons = { success: "✓", warning: "⚠", error: "✗" };
    return icons[type] || "💡";
  };

  const getSuggestionColor = (type) => {
    const colors = {
      success: "text-green-400 bg-green-900/20 border-green-500",
      warning: "text-yellow-400 bg-yellow-900/20 border-yellow-500",
      error: "text-red-400 bg-red-900/20 border-red-500",
    };
    return colors[type] || "text-blue-400 bg-blue-900/20 border-blue-500";
  };

  return (
    <div className="min-h-screen w-full flex">
      <div className="w-1/2 h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8 border-r border-gray-200 dark:border-gray-700">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Upload PDF or Image
          </h2>

          <form onSubmit={handleUpload} className="space-y-6">
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload").click()}
              className={`border-3 border-dashed rounded-xl p-16 text-center transition-all duration-300 cursor-pointer
                ${
                  isDragOver
                    ? "neon-border scale-105 bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 text-gray-400">
                  <svg
                    className={isDragOver ? "text-blue-500 animate-bounce" : ""}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 48 48"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-xl">
                    {isDragOver ? (
                      <span className="text-blue-500 font-bold animate-pulse">
                        Drop your file here!
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          Click to upload
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PDF or Image files only (Max 10MB)
                  </p>
                </div>

                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,image/*"
                  id="file-upload"
                />
              </div>
            </div>

            {file && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-green-500">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                      setAnalysis(null);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                "Upload & Extract Text"
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg fade-in">
              <p className="text-red-600 dark:text-red-400 text-sm flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            </div>
          )}

          {result && analysis && (
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Words
                </p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {analysis.wordCount}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Reading Time
                </p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {analysis.readingTime} min
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 h-screen overflow-hidden bg-white dark:bg-gray-800 flex flex-col">
        {result ? (
          <>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === "text"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Extracted Text
              </button>
              <button
                onClick={() => setActiveTab("analysis")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === "analysis"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Content Analysis
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === "text" ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                      Extracted Content
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.text);
                        alert("Text copied to clipboard!");
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      📋 Copy Text
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 min-h-[400px]">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-mono">
                      {result.text}
                    </pre>
                  </div>
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Document ID: {result.docId}
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {analysis && (
                    <>
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                          Engagement Score
                        </h3>
                        <div className="flex items-center space-x-4">
                          <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-32 h-32">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${
                                  (analysis.engagementScore / 100) * 352
                                } 352`}
                                className={getEngagementColor(
                                  analysis.engagementScore
                                )}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className={`text-3xl font-bold ${getEngagementColor(
                                  analysis.engagementScore
                                )}`}
                              >
                                {analysis.engagementScore}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {analysis.engagementScore >= 80
                                ? "Excellent! Your content is highly engaging."
                                : analysis.engagementScore >= 60
                                ? "Good engagement potential with room for improvement."
                                : analysis.engagementScore >= 40
                                ? "Fair engagement. Consider implementing suggestions below."
                                : "Low engagement. Follow recommendations to improve."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Sentences
                          </p>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {analysis.sentenceCount}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Paragraphs
                          </p>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {analysis.paragraphCount}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Avg Word Length
                          </p>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {analysis.avgWordLength}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Readability
                          </p>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {analysis.readabilityScore}/100
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 col-span-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Estimated Reading Time
                          </p>
                          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {analysis.readingTime} minute
                            {analysis.readingTime !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                          Improvement Suggestions
                        </h3>
                        <div className="space-y-3">
                          {analysis.suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border flex items-start space-x-3 ${getSuggestionColor(
                                suggestion.type
                              )}`}
                            >
                              <span className="text-xl">
                                {getSuggestionIcon(suggestion.type)}
                              </span>
                              <p className="text-sm flex-1">
                                {suggestion.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m6 0h6m-6 6h6m-12 6h12M9 3h30a6 6 0 016 6v30a6 6 0 01-6 6H9a6 6 0 01-6-6V9a6 6 0 016-6z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Content Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Upload a PDF or image file to extract and analyze text content
              </p>
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 text-blue-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500">Upload File</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 text-green-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500">Extract Text</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 text-purple-500">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500">Analyze Content</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
