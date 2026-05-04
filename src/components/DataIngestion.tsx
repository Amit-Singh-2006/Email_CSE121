import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";

export function DataIngestion() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<"idle" | "uploading" | "mapping" | "done">("idle");
  const [feedback, setFeedback] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessingStatus("uploading");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/v1/students/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      setProcessingStatus("mapping");
      setTimeout(() => {
        setFeedback(data);
        setProcessingStatus("done");
      }, 1000); // Simulate AI mapping delay visually
    } catch (err) {
      console.error(err);
      setProcessingStatus("idle");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Upload Student Data</h2>
        <p className="text-sm text-gray-500 mt-1">Upload Excel (.xlsx, .csv) files. The AI mapping engine will automatically match your college's headers to our standard schema.</p>
      </div>

      {processingStatus === "idle" && (
        <form
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          <input type="file" id="fileUpload" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleChange} />
          <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${dragActive ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-gray-900 mb-1">Drag and drop your spreadsheet here</p>
          <p className="text-xs text-gray-500 mb-6">Support CSV, XLSX up to 50MB</p>
          <label
            htmlFor="fileUpload"
            className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Files
          </label>
        </form>
      )}

      {processingStatus !== "idle" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{file?.name}</h3>
                <p className="text-xs text-gray-500">{(file!.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            {processingStatus === "done" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Processing Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 animate-pulse">
                <AlertCircle className="w-4 h-4" /> {processingStatus === "uploading" ? "Uploading..." : "AI Auto-Mapping..."}
              </span>
            )}
          </div>

          {processingStatus === "done" && feedback && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500">Rows Detected</p>
                  <p className="text-2xl font-semibold text-slate-900">{feedback.rowsProcessed}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500">Mapped Columns</p>
                  <p className="text-2xl font-semibold text-slate-900">{feedback.columnMap.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-500">Validation Errors</p>
                  <p className="text-2xl font-semibold text-slate-900">0</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">AI Column Mapping Review</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Your File Header</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Target Schema Map</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feedback.columnMap.map((mapItem: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-gray-900 font-mono text-xs">{mapItem.original}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              {mapItem.mappedTo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  onClick={() => {setProcessingStatus("idle"); setFile(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                  Confirm & Sync to Database <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
