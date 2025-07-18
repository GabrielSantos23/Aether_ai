import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function GalleryPage() {
  const images = useQuery(api.chat.queries.getUserAIImages) || [];
  const deleteImage = useMutation(api.chat.mutations.deleteAIImage);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openModal = (img: any) => {
    setSelectedImage(img);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };
  const handleDelete = async (imageId: string) => {
    setDeleting(imageId);
    await deleteImage({ imageId });
    setDeleting(null);
    if (selectedImage && selectedImage._id === imageId) {
      closeModal();
    }
  };

  return (
    <div className="px-2 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
        {images.map((img: any, i: number) => (
          <div
            key={img._id}
            className="relative group  overflow-hidden shadow-md bg-white/5 hover:bg-white/10 transition-all"
            style={{ aspectRatio: "1/1" }}
          >
            <button
              className="w-full h-full focus:outline-none"
              onClick={() => openModal(img)}
              style={{ background: "none", border: "none", padding: 0 }}
            >
              <img
                src={img.imageUrl}
                alt="AI generated"
                className="w-full h-full object-cover rounded-md cursor-pointer group-hover:opacity-80 transition-opacity duration-300"
                draggable={false}
              />
            </button>
          </div>
        ))}
      </div>
      {modalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/30">
          <div className="relative bg-transparent">
            {/* Delete button in modal */}
            <button
              onClick={() => handleDelete(selectedImage._id)}
              disabled={deleting === selectedImage._id}
              className="absolute top-2 right-14 text-white bg-black/60 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-80 z-20"
              aria-label="Delete"
              title="Delete image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-24 text-white text-2xl font-bold bg-black/40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 z-20"
              aria-label="Close"
            >
              ×
            </button>
            {/* Download button */}
            <a
              href={selectedImage.imageUrl}
              download
              className="absolute top-2 right-2 text-white bg-black/60 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-80 z-20"
              aria-label="Download"
              title="Download image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m0 0l-6-6m6 6l6-6"
                />
              </svg>
            </a>
            <img
              src={selectedImage.imageUrl}
              alt="Full size"
              className="max-w-[80vw] max-h-[80vh] rounded-xl shadow-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
