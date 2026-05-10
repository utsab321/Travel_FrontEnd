import React, { useState, useEffect } from "react";
import { Upload, Trash2, X, Camera } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";

const getApiUrl = () => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
  return backendUrl;
};

const token = () => localStorage.getItem("access_token");

const avatar = (url) =>
  url ? (url.startsWith("http") ? url : `${getApiUrl()}${url}`) : null;

export default function TripPhotos({ tripId, isCompleted, currentUserId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Fetch photos
  useEffect(() => {
    if (isCompleted) {
      fetchPhotos();
    }
  }, [tripId, isCompleted]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/trips/${tripId}/photos/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        setError("");
      }
    } catch (err) {
      console.error("Failed to fetch photos:", err);
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("caption", caption);

    try {
      const response = await fetch(`${API}/api/trips/${tripId}/photos/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });

      if (response.ok) {
        const newPhoto = await response.json();
        setPhotos([newPhoto, ...photos]);
        setSelectedFile(null);
        setCaption("");
        setPreview(null);
        setError("");
      } else {
        const data = await response.json();
        setError(data.detail || "Failed to upload photo");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm("Delete this photo?")) return;

    try {
      const response = await fetch(`${API}/api//trips/${photoId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });

      if (response.ok) {
        setPhotos(photos.filter((p) => p.id !== photoId));
      } else {
        setError("Failed to delete photo");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete photo");
    }
  };

  if (!isCompleted) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-5 h-5 text-[#C9A84C]" />
        <h3 style={{ fontFamily: "DM Sans" }} className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white/30">
          Trip Gallery
        </h3>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 rounded-xl bg-white/2 border border-white/8">
        {!preview ? (
          <label className="flex flex-col items-center justify-center gap-3 cursor-pointer py-6">
            <Upload className="w-6 h-6 text-[#C9A84C]" />
            <div className="text-center">
              <p style={{ fontFamily: "DM Sans" }} className="text-sm font-semibold text-black">
                Click to upload photo
              </p>
              <p style={{ fontFamily: "DM Sans" }} className="text-[12px] text-gray-600">
                JPG, PNG up to 5MB
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={preview}
                alt="preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/8 border border-white/10 text-black placeholder-gray-500 focus:outline-none focus:border-[#C9A84C]/50"
              style={{ fontFamily: "DM Sans" }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-3 py-2 rounded-lg bg-[#C9A84C] text-black font-semibold text-sm hover:bg-[#e8c96d] transition disabled:opacity-50"
                style={{ fontFamily: "DM Sans" }}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                  setCaption("");
                }}
                className="px-3 py-2 rounded-lg bg-white/10 text-black hover:bg-white/20 transition"
                style={{ fontFamily: "DM Sans" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
          <p style={{ fontFamily: "DM Sans" }} className="text-sm text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Photos Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p style={{ fontFamily: "DM Sans" }} className="text-gray-600">
            Loading photos...
          </p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p style={{ fontFamily: "DM Sans" }} className="text-gray-600">
            No photos yet. Be the first to share!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group rounded-lg overflow-hidden bg-white/5 border border-white/8">
              {/* Photo Image */}
              <div className="relative aspect-square overflow-hidden bg-black/20 cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                <img
                  src={photo.image}
                  alt={photo.caption || "trip photo"}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                {currentUserId === photo.uploaded_by && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(photo.id);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>

              {/* Photo Info */}
              <div className="p-3">
                {photo.caption && (
                  <p
                    style={{ fontFamily: "DM Sans" }}
                    className="text-sm text-gray-700 mb-2 line-clamp-2"
                  >
                    {photo.caption}
                  </p>
                )}

                {/* Uploader Info */}
                <div className="flex items-center gap-2">
                  {photo.uploaded_by_avatar ? (
                    <img
                      src={avatar(photo.uploaded_by_avatar)}
                      alt={photo.uploaded_by_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#C9A84C]/30 flex items-center justify-center">
                      <span
                        style={{ fontFamily: "DM Sans" }}
                        className="text-[10px] font-bold text-[#C9A84C]"
                      >
                        {photo.uploaded_by_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      style={{ fontFamily: "DM Sans" }}
                      className="text-[11px] font-semibold text-gray-700 truncate"
                    >
                      {photo.uploaded_by_name}
                    </p>
                    <p
                      style={{ fontFamily: "DM Sans" }}
                      className="text-[10px] text-gray-500"
                    >
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Image Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-screen flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full z-10 transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <img
              src={selectedPhoto.image}
              alt={selectedPhoto.caption || "trip photo"}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />

            {/* Info Section */}
            <div className="mt-4 bg-white/5 border border-white/8 rounded-lg p-4">
              {selectedPhoto.caption && (
                <p
                  style={{ fontFamily: "DM Sans" }}
                  className="text-white/80 mb-3"
                >
                  {selectedPhoto.caption}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedPhoto.uploaded_by_avatar ? (
                    <img
                      src={avatar(selectedPhoto.uploaded_by_avatar)}
                      alt={selectedPhoto.uploaded_by_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C]/30 flex items-center justify-center">
                      <span
                        style={{ fontFamily: "DM Sans" }}
                        className="text-[11px] font-bold text-[#C9A84C]"
                      >
                        {selectedPhoto.uploaded_by_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p
                      style={{ fontFamily: "DM Sans" }}
                      className="text-white/90 text-sm font-semibold"
                    >
                      {selectedPhoto.uploaded_by_name}
                    </p>
                    <p
                      style={{ fontFamily: "DM Sans" }}
                      className="text-white/50 text-xs"
                    >
                      {new Date(selectedPhoto.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
