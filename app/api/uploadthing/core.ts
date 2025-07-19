import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session || !session.userId)
        throw new UploadThingError("Unauthorized");

      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
  pdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session || !session.userId)
        throw new UploadThingError("Unauthorized");
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
  fileUploader: f({
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "16MB" },
  })
    .middleware(async ({ req }) => {
      const session = await auth();
      if (!session || !session.userId)
        throw new UploadThingError("Unauthorized");
      return { userId: session.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
